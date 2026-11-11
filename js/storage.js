// storage.js — localStorage wrapper with Custom Menus & Fine-grained History
const SETTINGS_KEY     = 'rm_settings';
const HISTORY_KEY      = 'rm_history';
const CUSTOM_MENUS_KEY = 'rm_custom_menus';
const TTL_DAYS         = 30;

export const DEFAULT_SETTINGS = {
  morning: {
    count:          2,
    no_spicy:       true,
    dish_types:     ['กับข้าว'],      // จานเดียวต้องติ้กเพิ่ม
    include_single: false,
  },
  evening: {
    count:          2,
    no_spicy:       false,
    dish_types:     ['กับข้าว', 'ต้ม/แกง', 'จานเดียว'],
    pair_soup:      false,
  },
  global: {
    no_repeat_30d:  true,
    proteins:       [],               // [] = ไม่ filter (เอาทั้งหมด)
    cuisines:       [],               // [] = ไม่ filter
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

// ─── Custom Menus ────────────────────────────────────────────────────────────

export function loadCustomMenus() {
  try {
    const raw = localStorage.getItem(CUSTOM_MENUS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addCustomMenu(menu) {
  const custom = loadCustomMenus();
  const id = menu.id || `custom_${Date.now()}`;
  const newMenu = { ...menu, id, is_custom: true };
  custom.unshift(newMenu);
  localStorage.setItem(CUSTOM_MENUS_KEY, JSON.stringify(custom));
  return newMenu;
}

export function deleteCustomMenu(id) {
  const custom = loadCustomMenus().filter(m => m.id !== id);
  localStorage.setItem(CUSTOM_MENUS_KEY, JSON.stringify(custom));
  removeHistoryById(id);
  return custom;
}

export function getCombinedMenus(baseMenus) {
  const custom = loadCustomMenus();
  const customFiltered = custom.filter(cm => !baseMenus.some(bm => bm.id === cm.id));
  return [...customFiltered, ...baseMenus];
}
