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

// ─── Custom Menus & GitHub Database Sync ────────────────────────────────────

export const GITHUB_REPO_KEY  = 'rm_github_repo';
export const GITHUB_TOKEN_KEY = 'rm_github_token';
export const DEFAULT_REPO     = 'kwankhaosiva-repo/random-menu-nn';

let remoteCustomMenus = [];

export async function initRemoteCustomDb() {
  try {
    const res = await fetch(`./data/custom_db.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        remoteCustomMenus = data.map(m => ({ ...m, is_custom: true, is_github_db: true }));
      }
    }
  } catch (e) {
    console.warn('Could not load central custom_db.json:', e);
  }
  return remoteCustomMenus;
}

export function getGitHubConfig() {
  return {
    repo: localStorage.getItem(GITHUB_REPO_KEY) || DEFAULT_REPO,
    token: localStorage.getItem(GITHUB_TOKEN_KEY) || '',
  };
}

export function saveGitHubConfig(token, repo = DEFAULT_REPO) {
  if (token) localStorage.setItem(GITHUB_TOKEN_KEY, token.trim());
  else localStorage.removeItem(GITHUB_TOKEN_KEY);
  if (repo) localStorage.setItem(GITHUB_REPO_KEY, repo.trim());
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

export async function commitMenuToGitHub(newMenu, token, repo = DEFAULT_REPO) {
  if (!token) throw new Error('ไม่พบ GitHub Personal Access Token');
  const cleanRepo = repo.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
  const apiUrl = `https://api.github.com/repos/${cleanRepo}/contents/data/custom_db.json`;

  let currentList = [];
  let sha = null;

  const getRes = await fetch(apiUrl, {
    headers: {
      'Authorization': `token ${token.trim()}`,
      'Accept': 'application/vnd.github.v3+json',
    }
  });

  if (getRes.ok) {
    const fileData = await getRes.json();
    sha = fileData.sha;
    if (fileData.content) {
      try {
        const decoded = decodeURIComponent(escape(atob(fileData.content.replace(/\s/g, ''))));
        currentList = JSON.parse(decoded);
      } catch {}
    }
  } else if (getRes.status !== 404) {
    const errJson = await getRes.json().catch(() => ({}));
    throw new Error(`GitHub API (${getRes.status}): ${errJson.message || getRes.statusText}`);
  }

  // Append new menu if not duplicate
  const existingIdx = currentList.findIndex(m => m.id === newMenu.id || m.name === newMenu.name);
  if (existingIdx !== -1) {
    currentList[existingIdx] = newMenu;
  } else {
    currentList.push(newMenu);
  }

  const updatedJsonStr = JSON.stringify(currentList, null, 2);
  const base64Content = btoa(unescape(encodeURIComponent(updatedJsonStr)));

  const putPayload = {
    message: `🍱 Add menu: "${newMenu.name}" to custom_db.json [via Web DB]`,
    content: base64Content,
    branch: 'main',
  };
  if (sha) putPayload.sha = sha;

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token.trim()}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(putPayload),
  });

  if (!putRes.ok) {
    const errJson = await putRes.json().catch(() => ({}));
    throw new Error(`บันทึกลง GitHub ล้มเหลว (${putRes.status}): ${errJson.message || putRes.statusText}`);
  }

  // Update in-memory remote database immediately
  remoteCustomMenus = currentList.map(m => ({ ...m, is_custom: true, is_github_db: true }));
  return putRes.json();
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
