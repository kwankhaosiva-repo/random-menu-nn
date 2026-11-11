// app.js — core random logic + UI controller
import { MENUS, PROTEIN_GROUPS } from '../data/menus.js';
import {
  loadSettings, saveSettings,
  loadHistory, addHistory, clearHistory, isInHistory,
  DEFAULT_SETTINGS,
} from './storage.js';

// ─── Utility ────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Filter logic ───────────────────────────────────────────────────────────

function filterMenus(slotSettings, globalSettings) {
  const { no_spicy, dish_types, include_single } = slotSettings;
  const { no_repeat_30d, proteins, cuisines } = globalSettings;

  // effective dish_types
  const effectiveTypes = include_single
    ? dish_types
    : dish_types.filter(t => t !== 'จานเดียว');

  return MENUS.filter(m => {
    // dish_type
    if (effectiveTypes.length && !effectiveTypes.includes(m.dish_type)) return false;
    // spicy
    if (no_spicy && m.spicy) return false;
    // cuisine filter ([] = ไม่ filter)
    if (cuisines.length && !cuisines.includes(m.cuisine)) return false;
    // protein filter ([] = ไม่ filter)
    if (proteins.length) {
      // เลือกเป็น protein_groups level
      const hasGroup = m.protein_groups.some(g => proteins.includes(g))
        || (m.protein_groups.length === 0 && proteins.includes('ผัก'));
      if (!hasGroup) return false;
    }
    // no-repeat 30d
    if (no_repeat_30d && isInHistory(m.id)) return false;
    return true;
  });
}

function pick(slotSettings, globalSettings) {
  const pool   = filterMenus(slotSettings, globalSettings);
  const count  = Math.min(slotSettings.count, pool.length);
  if (count === 0) return [];
  return shuffle(pool).slice(0, count);
}

// ─── UI helpers ─────────────────────────────────────────────────────────────

const CUISINE_EMOJI = { ไทย: '🇹🇭', จีน: '🇨🇳', ญี่ปุ่น: '🇯🇵', ฝรั่ง: '🌍' };
const TYPE_COLOR    = { จานเดียว: 'tag-single', กับข้าว: 'tag-side', 'ต้ม/แกง': 'tag-soup' };

function menuCard(m) {
  const spicyBadge = m.spicy ? '<span class="badge badge-spicy">🌶️ เผ็ด</span>' : '';
  const typeBadge  = `<span class="badge ${TYPE_COLOR[m.dish_type] || ''}">${m.dish_type}</span>`;
  const cuisine    = `<span class="cuisine-flag">${CUISINE_EMOJI[m.cuisine] || '🍽️'} ${m.cuisine}</span>`;
  return `
    <div class="menu-card" data-id="${m.id}">
      <div class="menu-name">${m.name}</div>
      <div class="menu-meta">${cuisine}${typeBadge}${spicyBadge}</div>
    </div>`;
}

function renderResults(morningMenus, eveningMenus) {
  const zone = document.getElementById('results');
  if (!morningMenus.length && !eveningMenus.length) {
    zone.innerHTML = '<p class="empty-msg">ไม่พบเมนูตามเงื่อนไขที่เลือก กรุณาปรับ filter</p>';
    return;
  }

  let html = '';

  if (morningMenus.length) {
    html += `<div class="result-block"><div class="meal-label">🌅 มื้อเช้า</div>`;
    html += morningMenus.map(menuCard).join('');
    html += '</div>';
  }
  if (eveningMenus.length) {
    html += `<div class="result-block"><div class="meal-label">🌆 มื้อเย็น</div>`;
    html += eveningMenus.map(menuCard).join('');
    html += '</div>';
  }

  zone.innerHTML = html;
  zone.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ─── History modal ──────────────────────────────────────────────────────────

function formatDate(ts) {
  const d   = new Date(ts);
  const now = new Date();
  const diffD = Math.floor((now - d) / 86400_000);
  if (diffD === 0) return 'วันนี้';
  if (diffD === 1) return 'เมื่อวาน';
  return `${diffD} วันที่แล้ว`;
}

function renderHistory() {
  const list = loadHistory();
  const modal = document.getElementById('history-modal');

  if (!list.length) {
    document.getElementById('history-list').innerHTML =
      '<p class="empty-msg">ยังไม่มีประวัติการสุ่ม</p>';
    modal.classList.add('open');
    return;
  }

  // group by date
  const groups = {};
  list.forEach(h => {
    const label = formatDate(h.ts);
    if (!groups[label]) groups[label] = [];
    groups[label].push(h);
  });

  let html = '';
  for (const [label, items] of Object.entries(groups)) {
    html += `<div class="hist-group-label">${label}</div>`;
    items.forEach(h => {
      const mealIcon = h.meal === 'morning' ? '🌅' : '🌆';
      html += `<div class="hist-item">${mealIcon} ${h.name}</div>`;
    });
  }

  document.getElementById('history-list').innerHTML = html;
  modal.classList.add('open');
}

// ─── Settings panel ─────────────────────────────────────────────────────────

function readFormSettings() {
  const s = {
    morning: {
      count:          parseInt(document.querySelector('[name=morning-count].active')?.dataset.val ?? '2'),
      no_spicy:       document.getElementById('morning-no-spicy').checked,
      dish_types:     ['กับข้าว'],
      include_single: document.getElementById('morning-include-single').checked,
    },
    evening: {
      count:          parseInt(document.querySelector('[name=evening-count].active')?.dataset.val ?? '2'),
      no_spicy:       document.getElementById('evening-no-spicy').checked,
      dish_types:     ['กับข้าว', 'ต้ม/แกง', 'จานเดียว'],
      pair_soup:      document.getElementById('evening-pair-soup').checked,
    },
    global: {
      no_repeat_30d: document.getElementById('global-no-repeat').checked,
      proteins:      [...document.querySelectorAll('[name=protein]:checked')].map(el => el.value),
      cuisines:      [...document.querySelectorAll('[name=cuisine]:checked')].map(el => el.value),
    },
  };

  // เย็น: no_spicy toggle
  if (s.evening.no_spicy) {
    s.evening.dish_types = s.evening.dish_types; // ยังรวมทุกประเภทแต่ filter spicy
  }

  return s;
}

function applySettingsToForm(s) {
  // morning count
  document.querySelectorAll('[name=morning-count]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === String(s.morning.count));
  });
  document.getElementById('morning-no-spicy').checked      = s.morning.no_spicy;
  document.getElementById('morning-include-single').checked = s.morning.include_single;

  // evening count
  document.querySelectorAll('[name=evening-count]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === String(s.evening.count));
  });
  document.getElementById('evening-no-spicy').checked  = s.evening.no_spicy;
  document.getElementById('evening-pair-soup').checked = s.evening.pair_soup;

  // global
  document.getElementById('global-no-repeat').checked = s.global.no_repeat_30d;

  document.querySelectorAll('[name=protein]').forEach(cb => {
    cb.checked = s.global.proteins.length === 0 || s.global.proteins.includes(cb.value);
  });
  document.querySelectorAll('[name=cuisine]').forEach(cb => {
    cb.checked = s.global.cuisines.length === 0 || s.global.cuisines.includes(cb.value);
  });
}

// ─── Boot ───────────────────────────────────────────────────────────────────

function boot() {
  const settings = loadSettings();
  applySettingsToForm(settings);

  // Count buttons
  document.querySelectorAll('.count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.getAttribute('name');
      document.querySelectorAll(`[name=${group}]`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      autoSave();
    });
  });

  // Auto-save any toggle/checkbox change
  document.querySelectorAll('input[type=checkbox]').forEach(el => {
    el.addEventListener('change', autoSave);
  });

  // Random button
  document.getElementById('btn-random').addEventListener('click', doRandom);

  // History
  document.getElementById('btn-history').addEventListener('click', renderHistory);
  document.getElementById('history-close').addEventListener('click', () => {
    document.getElementById('history-modal').classList.remove('open');
  });
  document.getElementById('history-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
  });
  document.getElementById('btn-clear-history').addEventListener('click', () => {
    if (confirm('ล้างประวัติทั้งหมด?')) {
      clearHistory();
      renderHistory();
    }
  });

  // Settings toggle
  document.getElementById('btn-settings-toggle').addEventListener('click', () => {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('open');
    document.getElementById('btn-settings-toggle').textContent =
      panel.classList.contains('open') ? '▲ ซ่อน Config' : '⚙️ Config';
  });

  // Reset settings
  document.getElementById('btn-reset-settings').addEventListener('click', () => {
    if (confirm('รีเซ็ตค่า default ทั้งหมด?')) {
      saveSettings(DEFAULT_SETTINGS);
      applySettingsToForm(DEFAULT_SETTINGS);
    }
  });
}

function autoSave() {
  saveSettings(readFormSettings());
}

function doRandom() {
  const s = readFormSettings();
  saveSettings(s);

  const morning = pick(s.morning, s.global);
  const evening = pick(s.evening, s.global);

  if (morning.length || evening.length) {
    const histEntries = [
      ...morning.map(m => ({ id: m.id, name: m.name, meal: 'morning' })),
      ...evening.map(m => ({ id: m.id, name: m.name, meal: 'evening' })),
    ];
    addHistory(histEntries);
  }

  renderResults(morning, evening);

  const btn = document.getElementById('btn-random');
  btn.textContent = '🔄 สุ่มใหม่!';
  btn.classList.add('spin');
  setTimeout(() => btn.classList.remove('spin'), 400);
}

document.addEventListener('DOMContentLoaded', boot);
