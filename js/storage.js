// storage.js — localStorage wrapper with Custom Menus & Fine-grained History
const SETTINGS_KEY     = 'rm_settings';
const HISTORY_KEY      = 'rm_history';
const CUSTOM_MENUS_KEY = 'rm_custom_menus';
const TTL_DAYS         = 30;

export const DEFAULT_SETTINGS = {
  morning: {
    count:          2,
    no_spicy:       true,
    dish_types:     ['กับข้าว'],
    pair_soup:      false,
  },
  evening: {
    count:          2,
    no_spicy:       false,
    dish_types:     ['กับข้าว'],
    pair_soup:      false,
  },
  global: {
    no_repeat_30d:  true,
    proteins:       [],
    specific_cuts:  [],
    cuisines:       ['ไทย', 'จีน', 'ญี่ปุ่น', 'ฝรั่ง'],
    regions:        ['กลาง', 'อีสาน', 'เหนือ', 'ใต้'],
    dish_types:     [],
  },
};

// ─── Settings ────────────────────────────────────────────────────────────────

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    const parsed = JSON.parse(raw);
    return {
      morning: { ...DEFAULT_SETTINGS.morning, ...(parsed.morning || {}) },
      evening: { ...DEFAULT_SETTINGS.evening, ...(parsed.evening || {}) },
      global:  { ...DEFAULT_SETTINGS.global,  ...(parsed.global || {}) },
    };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ─── History ─────────────────────────────────────────────────────────────────

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const all = raw ? JSON.parse(raw) : [];
    const cutoff = Date.now() - TTL_DAYS * 86400_000;
    const fresh  = all.filter(h => h.ts && h.ts >= cutoff);
    if (fresh.length !== all.length) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(fresh));
    }
    return fresh;
  } catch {
    return [];
  }
}

export function addHistory(entries) {
  // entries: [{id, name, meal}]
  const history = loadHistory();
  const ts = Date.now();
  entries.forEach((e, idx) => {
    history.unshift({ ...e, ts: ts + idx });
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function removeHistoryItem(id, ts) {
  let history = loadHistory();
  if (ts) {
    history = history.filter(h => !(h.id === id && h.ts === Number(ts)));
  } else {
    const idx = history.findIndex(h => h.id === id);
    if (idx !== -1) history.splice(idx, 1);
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function removeHistoryById(id) {
  const history = loadHistory().filter(h => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function isInHistory(id) {
  return loadHistory().some(h => h.id === id);
}

// ─── Firebase Firestore Cloud Database Sync ─────────────────────────────────

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getFirestore, collection, getDocs, addDoc, query, limit 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB8I9wgtcQRYzncYjcyOlOycdS_e52Jybw",
  authDomain: "random-menu-nn.firebaseapp.com",
  projectId: "random-menu-nn",
  storageBucket: "random-menu-nn.firebasestorage.app",
};

export const FIRESTORE_DATABASE_ID = "random-menu-nn-db";
export const FIRESTORE_COLLECTION = "custom_menus";
export const QUERY_LIMIT = 500;

let dbInstance = null;
let cachedClientIp = null;
let remoteCustomMenus = [];

export function getDb() {
  if (dbInstance) return dbInstance;
  try {
    const app = initializeApp(FIREBASE_CONFIG);
    try {
      dbInstance = getFirestore(app, FIRESTORE_DATABASE_ID);
    } catch {
      dbInstance = getFirestore(app);
    }
    return dbInstance;
  } catch (e) {
    console.warn('Could not initialize Firebase Firestore:', e);
    return null;
  }
}

// ─── Client Security: IP & Device Fingerprint ───────────────────────────────

export async function getClientIp() {
  if (cachedClientIp) return cachedClientIp;
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      cachedClientIp = data.ip || 'unknown';
      return cachedClientIp;
    }
  } catch (e) {
    console.warn('Could not fetch public IP:', e);
  }
  return 'unknown';
}

export function getDeviceFingerprint() {
  try {
    const nav = window.navigator;
    const scr = window.screen;
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    let canvasHash = 0;
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(10, 5, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('random-menu-fp', 2, 15);
      const dataUrl = canvas.toDataURL();
      for (let i = 0; i < dataUrl.length; i++) {
        canvasHash = ((canvasHash << 5) - canvasHash) + dataUrl.charCodeAt(i);
        canvasHash |= 0;
      }
    }

    const rawId = [
      nav.userAgent || '',
      nav.language || '',
      nav.hardwareConcurrency || '',
      scr.width || '',
      scr.height || '',
      scr.colorDepth || '',
      new Date().getTimezoneOffset(),
      canvasHash
    ].join('###');

    let hash = 2166136261;
    for (let i = 0; i < rawId.length; i++) {
      hash ^= rawId.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const hex = (hash >>> 0).toString(16).padStart(8, '0');
    return `fp_${hex}`;
  } catch {
    return 'fp_fallback';
  }
}

// ─── Remote Custom Menus Synchronization ────────────────────────────────────

export async function initRemoteCustomDb() {
  // 1. Try fetching from Cloud Firestore with Query Limit 500
  const db = getDb();
  if (db) {
    try {
      const q = query(collection(db, FIRESTORE_COLLECTION), limit(QUERY_LIMIT));
      const snap = await getDocs(q);
      if (snap && !snap.empty) {
        remoteCustomMenus = snap.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: data.id || doc.id,
            is_custom: true,
            is_firestore: true,
          };
        });
        return remoteCustomMenus;
      }
    } catch (err) {
      console.warn('Firestore load skipped (fallback to local custom_db.json):', err.message);
    }
  }

  // 2. Fallback to repository static custom_db.json
  try {
    const res = await fetch(`./data/custom_db.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        remoteCustomMenus = data.map(m => ({ ...m, is_custom: true, is_github_db: true }));
      }
    }
  } catch (e) {
    console.warn('Could not load local custom_db.json fallback:', e);
  }
  return remoteCustomMenus;
}

export async function saveMenuToFirestore(menu) {
  const db = getDb();
  if (!db) throw new Error('ไม่สามารถเชื่อมต่อ Firebase Firestore ได้');

  const client_ip = await getClientIp();
  const fingerprint_id = getDeviceFingerprint();
  const created_at = new Date().toISOString();

  const payload = {
    name: String(menu.name).trim(),
    base_name: String(menu.base_name || menu.name).trim(),
    name_template: String(menu.name_template || menu.name).trim(),
    cuisine: String(menu.cuisine || 'ไทย'),
    region: menu.region ? String(menu.region) : null,
    dish_type: String(menu.dish_type || 'กับข้าว'),
    spicy: Boolean(menu.spicy),
    is_pair: Boolean(menu.is_pair),
    allowed_proteins: Array.isArray(menu.allowed_proteins) ? menu.allowed_proteins : ['ผัก'],
    proteins: Array.isArray(menu.proteins) ? menu.proteins : ['ผัก'],
    protein_groups: Array.isArray(menu.protein_groups) ? menu.protein_groups : [],
    created_at,
    fingerprint_id,
    client_ip,
  };

  const docRef = await addDoc(collection(db, FIRESTORE_COLLECTION), payload);
  const savedMenu = { ...payload, id: docRef.id, is_custom: true, is_firestore: true };

  // Update in-memory list
  const existingIdx = remoteCustomMenus.findIndex(m => m.id === savedMenu.id || m.name === savedMenu.name);
  if (existingIdx !== -1) {
    remoteCustomMenus[existingIdx] = savedMenu;
  } else {
    remoteCustomMenus.unshift(savedMenu);
  }

  return savedMenu;
}

export function loadCustomMenus() {
  try {
    const raw = localStorage.getItem(CUSTOM_MENUS_KEY);
    const local = raw ? JSON.parse(raw) : [];
    // Merge remote database and local offline cache
    const map = new Map();
    remoteCustomMenus.forEach(m => {
      const key = m.id || m.name;
      map.set(key, { ...m, is_custom: true, is_github_db: true });
    });
    local.forEach(m => {
      const key = m.id || m.name;
      if (!map.has(key)) {
        map.set(key, { ...m, is_custom: true });
      }
    });
    return [...map.values()];
  } catch {
    return remoteCustomMenus;
  }
}

export function addCustomMenu(menu) {
  const custom = loadCustomMenus();
  const id = menu.id || `custom_${Date.now()}`;
  const newMenu = { ...menu, id, is_custom: true };

  // Save to local storage cache
  try {
    const raw = localStorage.getItem(CUSTOM_MENUS_KEY);
    const local = raw ? JSON.parse(raw) : [];
    local.unshift(newMenu);
    localStorage.setItem(CUSTOM_MENUS_KEY, JSON.stringify(local));
  } catch {}

  return newMenu;
}

export function deleteCustomMenu(id) {
  try {
    const raw = localStorage.getItem(CUSTOM_MENUS_KEY);
    const local = raw ? JSON.parse(raw) : [];
    const updatedLocal = local.filter(m => m.id !== id);
    localStorage.setItem(CUSTOM_MENUS_KEY, JSON.stringify(updatedLocal));
  } catch {}
  remoteCustomMenus = remoteCustomMenus.filter(m => m.id !== id);
  removeHistoryById(id);
  return loadCustomMenus();
}

export function getCombinedMenus(baseMenus) {
  const custom = loadCustomMenus();
  const customFiltered = custom.filter(cm => !baseMenus.some(bm => bm.id === cm.id));
  return [...customFiltered, ...baseMenus];
}

export function getCombinedBaseMenus(builtinBases) {
  const custom = loadCustomMenus();
  const customBases = custom.map(cm => ({
    id: cm.id,
    base_name: cm.base_name || cm.name,
    name_template: cm.name_template || cm.name,
    cuisine: cm.cuisine,
    region: cm.region || null,
    dish_type: cm.dish_type,
    spicy: Boolean(cm.spicy),
    is_pair: Boolean(cm.is_pair),
    allowed_proteins: cm.allowed_proteins || cm.proteins || ['ผัก'],
    is_custom: true,
  }));
  const customFiltered = customBases.filter(cb => !builtinBases.some(bb => bb.id === cb.id));
  return [...customFiltered, ...builtinBases];
}
