// storage.js — localStorage wrapper
const SETTINGS_KEY = 'rm_settings';
const HISTORY_KEY  = 'rm_history';
const TTL_DAYS     = 30;

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

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    return JSON.parse(raw);
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const all  = raw ? JSON.parse(raw) : [];
    const cutoff = Date.now() - TTL_DAYS * 86400_000;
    const fresh  = all.filter(h => h.ts >= cutoff);
    // purge expired entries
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
  entries.forEach(e => history.unshift({ ...e, ts }));
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function isInHistory(id) {
  return loadHistory().some(h => h.id === id);
}
