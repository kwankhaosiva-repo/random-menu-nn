// app.js — Core Random Logic & UI Controller
import { MENUS } from '../data/menus.js';
import {
  loadSettings, saveSettings,
  loadHistory, addHistory, removeHistoryItem, removeHistoryById, clearHistory, isInHistory,
  loadCustomMenus, addCustomMenu, deleteCustomMenu, getCombinedMenus,
  DEFAULT_SETTINGS,
} from './storage.js';

// ─── State ──────────────────────────────────────────────────────────────────

let currentMorning = [];
let currentEvening = [];
let activeCatalogFilter = 'all';

// ─── Utility ────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showToast(message, duration = 2500) {
  const toast = document.getElementById('app-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// ─── Filter Logic ───────────────────────────────────────────────────────────

function getEligibleMenus(slotSettings, globalSettings, excludeIds = []) {
  const allAvailable = getCombinedMenus(MENUS);
  const { no_spicy, dish_types, include_single } = slotSettings;
  const { no_repeat_30d, proteins, cuisines } = globalSettings;

  // Determine allowed dish types
  const effectiveTypes = include_single
    ? [...dish_types, 'จานเดียว']
    : dish_types.filter(t => t !== 'จานเดียว');

  return allAvailable.filter(m => {
    // Exclude menus already shown or specifically excluded
    if (excludeIds.includes(m.id)) return false;

    // Filter dish_type
    if (effectiveTypes.length && !effectiveTypes.includes(m.dish_type)) return false;

    // Filter spicy
    if (no_spicy && m.spicy) return false;

    // Filter cuisine ([] = all)
    if (cuisines && cuisines.length && !cuisines.includes(m.cuisine)) return false;

    // Filter proteins ([] = all)
    if (proteins && proteins.length) {
      const hasGroup = m.protein_groups && m.protein_groups.some(g => proteins.includes(g));
      const isVegOnly = (!m.protein_groups || m.protein_groups.length === 0) && proteins.includes('ผัก');
      if (!hasGroup && !isVegOnly) return false;
    }

    // Filter 30-day repetition
    if (no_repeat_30d && isInHistory(m.id)) return false;

    return true;
  });
}

function pickMultiple(slotSettings, globalSettings, excludeIds = [], ensurePairSoup = false) {
  let pool = getEligibleMenus(slotSettings, globalSettings, excludeIds);
  const count = slotSettings.count;
  if (!pool.length || count <= 0) return [];

  pool = shuffle(pool);
  const picked = [];

  // Guarantee soup/curry dish if requested and available
  if (ensurePairSoup) {
    const soupIndex = pool.findIndex(m => m.dish_type === 'ต้ม/แกง' || m.is_pair);
    if (soupIndex !== -1) {
      picked.push(pool.splice(soupIndex, 1)[0]);
    }
  }

  // Fill the remaining needed dishes
  while (picked.length < count && pool.length > 0) {
    picked.push(pool.pop());
  }

  return picked;
}

// ─── UI Rendering ───────────────────────────────────────────────────────────

const CUISINE_FLAGS = {
  ไทย: '🇹🇭 ไทย',
  จีน: '🇨🇳 จีน',
  ญี่ปุ่น: '🇯🇵 ญี่ปุ่น',
  ฝรั่ง: '🌍 ฝรั่ง',
};

const DISH_TYPE_CLASS = {
  จานเดียว: 'badge-type-single',
  กับข้าว: 'badge-type-side',
  'ต้ม/แกง': 'badge-type-soup',
};

function renderDishCard(menu, mealType) {
  const isMorning = mealType === 'morning';
  const typeClass = DISH_TYPE_CLASS[menu.dish_type] || 'badge-type-side';
  const spicyBadge = menu.spicy
    ? '<span class="badge badge-spicy">🌶️ เผ็ด</span>'
    : '<span class="badge badge-mild">🥬 ไม่เผ็ด</span>';
  const customBadge = menu.is_custom
    ? '<span class="badge badge-custom">⭐ เมนูของคุณ</span>'
    : '';

  const proteinBadges = (menu.protein_groups || [])
    .map(p => `<span class="badge badge-protein">${p}</span>`)
    .join('');

  return `
    <div class="result-dish-card ${isMorning ? 'morning-card' : 'evening-card'}" data-id="${menu.id}" data-meal="${mealType}">
      <div class="dish-info">
        <div class="dish-name-row">
          <span class="dish-name">${menu.name}</span>
          ${customBadge}
        </div>
        <div class="badges-row">
          <span class="badge badge-country">${CUISINE_FLAGS[menu.cuisine] || menu.cuisine}</span>
          <span class="badge ${typeClass}">${menu.dish_type}</span>
          ${spicyBadge}
          ${proteinBadges}
        </div>
      </div>
      <button type="button" class="btn-reroll-item" data-id="${menu.id}" data-meal="${mealType}" title="สุ่มเปลี่ยนเฉพาะเมนูนี้">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          <path d="M3 3v5h5"></path>
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
          <path d="M16 21h5v-5"></path>
        </svg>
        <span>สุ่มใหม่</span>
      </button>
    </div>
  `;
}

function renderResults(morningMenus, eveningMenus) {
  const container = document.getElementById('results-content');
  if (!container) return;

  if (!morningMenus.length && !eveningMenus.length) {
    container.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-icon">🔍</div>
        <h3 class="empty-title">ไม่พบเมนูที่ตรงตามเงื่อนไขที่เลือก</h3>
        <p class="empty-desc">ลองปลดล็อควัตถุดิบ หรือยกเลิกการเลือก "ไม่ซ้ำ 30 วัน" เพื่อเปิดรับรายการอาหารที่กว้างขึ้น</p>
      </div>
    `;
    return;
  }

  let html = '';

  if (morningMenus.length) {
    html += `
      <div class="meal-result-group">
        <div class="meal-result-header">
          <h3 class="meal-result-title morning-text">🌅 มื้อเช้า</h3>
          <span class="dish-count-tag">${morningMenus.length} เมนู</span>
        </div>
        <div class="dish-cards-list">
          ${morningMenus.map(m => renderDishCard(m, 'morning')).join('')}
        </div>
      </div>
    `;
  }

  if (eveningMenus.length) {
    html += `
      <div class="meal-result-group">
        <div class="meal-result-header">
          <h3 class="meal-result-title evening-text">🌆 มื้อเย็น</h3>
          <span class="dish-count-tag">${eveningMenus.length} เมนู</span>
        </div>
        <div class="dish-cards-list">
          ${eveningMenus.map(m => renderDishCard(m, 'evening')).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  // Bind individual reroll buttons
  container.querySelectorAll('.btn-reroll-item').forEach(btn => {
    btn.addEventListener('click', handleIndividualReroll);
  });

  // Smooth scroll into results view
  document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ─── Individual Reroll Handler ──────────────────────────────────────────────

function handleIndividualReroll(event) {
  const btn = event.currentTarget;
  const oldId = btn.dataset.id;
  const meal = btn.dataset.meal; // 'morning' or 'evening'
  const settings = readFormSettings();

  // 1. Remove the old menu from 30-day history so it won't be penalized
  removeHistoryById(oldId);

  // 2. Identify currently displayed IDs so the replacement doesn't duplicate them
  const currentDisplayedIds = [
    ...currentMorning.map(m => m.id),
    ...currentEvening.map(m => m.id),
  ];

  // 3. Pick single replacement
  const slotSettings = meal === 'morning' ? settings.morning : settings.evening;
  const candidatePool = getEligibleMenus(slotSettings, settings.global, currentDisplayedIds);

  if (!candidatePool.length) {
    showToast('⚠️ ไม่มีเมนูอื่นที่ตรงกับเงื่อนไขที่เลือก');
    return;
  }

  const replacement = shuffle(candidatePool)[0];

  // 4. Update state
  if (meal === 'morning') {
    const idx = currentMorning.findIndex(m => m.id === oldId);
    if (idx !== -1) currentMorning[idx] = replacement;
  } else {
    const idx = currentEvening.findIndex(m => m.id === oldId);
    if (idx !== -1) currentEvening[idx] = replacement;
  }

  // 5. Add new menu to history
  addHistory([{ id: replacement.id, name: replacement.name, meal }]);

  // 6. Re-render results & update header counters
  renderResults(currentMorning, currentEvening);
  updateHeaderCounts();
  showToast(`✨ สุ่มใหม่เป็น: ${replacement.name}`);
}

// ─── Main Random Roll Action ────────────────────────────────────────────────

function executeRandomRoll() {
  const settings = readFormSettings();
  saveSettings(settings);

  // 1. Roll for morning
  const morningList = pickMultiple(settings.morning, settings.global, []);

  // 2. Roll for evening (exclude morning picks to prevent same-day duplicates)
  const excludeForEvening = morningList.map(m => m.id);
  const eveningList = pickMultiple(
    settings.evening,
    settings.global,
    excludeForEvening,
    settings.evening.pair_soup
  );

  currentMorning = morningList;
  currentEvening = eveningList;

  // 3. Save to history
  const historyBatch = [
    ...morningList.map(m => ({ id: m.id, name: m.name, meal: 'morning' })),
    ...eveningList.map(m => ({ id: m.id, name: m.name, meal: 'evening' })),
  ];
  if (historyBatch.length) {
    addHistory(historyBatch);
  }

  // 4. Render results & update header
  renderResults(morningList, eveningList);
  updateHeaderCounts();

  // Animation pulse on CTA button
  const heroBtn = document.getElementById('btn-random-hero');
  heroBtn.classList.add('pulse');
  setTimeout(() => heroBtn.classList.remove('pulse'), 400);

  showToast(`🎉 สุ่มเมนูสำเร็จ! ได้ทั้งหมด ${morningList.length + eveningList.length} รายการ`);
}

// ─── Settings Form Read & Apply ─────────────────────────────────────────────

function readFormSettings() {
  const morningCountBtn = document.querySelector('[name=morning-count].active');
  const eveningCountBtn = document.querySelector('[name=evening-count].active');

  return {
    morning: {
      count: parseInt(morningCountBtn ? morningCountBtn.dataset.val : '2', 10),
      no_spicy: document.getElementById('morning-no-spicy').checked,
      dish_types: ['กับข้าว'],
      include_single: document.getElementById('morning-include-single').checked,
    },
    evening: {
      count: parseInt(eveningCountBtn ? eveningCountBtn.dataset.val : '2', 10),
      no_spicy: document.getElementById('evening-no-spicy').checked,
      dish_types: ['กับข้าว', 'ต้ม/แกง', 'จานเดียว'],
      pair_soup: document.getElementById('evening-pair-soup').checked,
    },
    global: {
      no_repeat_30d: document.getElementById('global-no-repeat').checked,
      proteins: [...document.querySelectorAll('[name=protein]:checked')].map(el => el.value),
      cuisines: [...document.querySelectorAll('[name=cuisine]:checked')].map(el => el.value),
    },
  };
}

function applySettingsToForm(s) {
  // Morning count
  document.querySelectorAll('[name=morning-count]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === String(s.morning.count));
  });
  document.getElementById('morning-no-spicy').checked = Boolean(s.morning.no_spicy);
  document.getElementById('morning-include-single').checked = Boolean(s.morning.include_single);

  // Evening count
  document.querySelectorAll('[name=evening-count]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === String(s.evening.count));
  });
  document.getElementById('evening-no-spicy').checked = Boolean(s.evening.no_spicy);
  document.getElementById('evening-pair-soup').checked = Boolean(s.evening.pair_soup);

  // Global preferences
  document.getElementById('global-no-repeat').checked = Boolean(s.global.no_repeat_30d);

  document.querySelectorAll('[name=protein]').forEach(cb => {
    cb.checked = s.global.proteins && s.global.proteins.includes(cb.value);
  });
  document.querySelectorAll('[name=cuisine]').forEach(cb => {
    cb.checked = s.global.cuisines && s.global.cuisines.includes(cb.value);
  });
}

function autoSaveSettings() {
  saveSettings(readFormSettings());
}

// ─── History Modal Controller ───────────────────────────────────────────────

function formatRelativeDate(ts) {
  if (!ts) return 'ไม่ระบุเวลา';
  const now = new Date();
  const date = new Date(ts);
  const diffDays = Math.floor((now - date) / 86400_000);
  if (diffDays <= 0) return 'วันนี้';
  if (diffDays === 1) return 'เมื่อวาน';
  return `${diffDays} วันที่แล้ว`;
}

function renderHistoryList(filterQuery = '') {
  const container = document.getElementById('history-items-container');
  const footerStat = document.getElementById('hist-footer-stat');
  const history = loadHistory();

  const query = filterQuery.trim().toLowerCase();
  const filtered = query
    ? history.filter(h => (h.name || '').toLowerCase().includes(query))
    : history;

  footerStat.textContent = `ทั้งหมด ${filtered.length} รายการ`;

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state-card" style="padding: 32px 16px;">
        <div class="empty-icon">${query ? '🔍' : '📋'}</div>
        <h4 class="empty-title">${query ? 'ไม่พบเมนูที่ค้นหา' : 'ยังไม่มีประวัติการสุ่ม'}</h4>
        <p class="empty-desc">${query ? 'ลองค้นหาด้วยคำอื่น' : 'เมื่อคุณกดสุ่มเมนู รายการจะถูกบันทึกไว้ที่นี่อัตโนมัติ'}</p>
      </div>
    `;
    return;
  }

  // Group by relative date
  const groups = {};
  filtered.forEach(item => {
    const label = formatRelativeDate(item.ts);
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  });

  let html = '';
  for (const [dayLabel, items] of Object.entries(groups)) {
    html += `<div class="hist-day-header">${dayLabel}</div>`;
    items.forEach(h => {
      const mealIcon = h.meal === 'morning' ? '🌅' : '🌆';
      const mealText = h.meal === 'morning' ? 'มื้อเช้า' : 'มื้อเย็น';
      const timeStr = h.ts ? new Date(h.ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '';

      html += `
        <div class="hist-item-row" data-id="${h.id}" data-ts="${h.ts}">
          <div class="hist-item-content">
            <span class="meal-badge-icon" title="${mealText}">${mealIcon}</span>
            <div class="hist-item-details">
              <span class="hist-dish-name">${h.name}</span>
              <span class="hist-time-tag">${mealText} ${timeStr ? '• ' + timeStr : ''}</span>
            </div>
          </div>
          <button type="button" class="btn-delete-row" data-id="${h.id}" data-ts="${h.ts}" title="ลบรายการนี้ออกจากประวัติ">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
    });
  }

  container.innerHTML = html;

  // Bind single item deletion
  container.querySelectorAll('.btn-delete-row').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = btn.dataset.id;
      const ts = btn.dataset.ts;
      removeHistoryItem(id, ts);
      renderHistoryList(document.getElementById('hist-search-input').value);
      updateHeaderCounts();
      showToast('🗑️ ลบรายการออกจากประวัติแล้ว');
    });
  });
}

function openHistoryModal() {
  const modal = document.getElementById('history-modal');
  const searchInput = document.getElementById('hist-search-input');
  searchInput.value = '';
  renderHistoryList('');
  modal.classList.add('open');
  searchInput.focus();
}

function closeHistoryModal() {
  document.getElementById('history-modal').classList.remove('open');
}

// ─── Catalog Modal Controller ───────────────────────────────────────────────

function renderCatalogList() {
  const container = document.getElementById('catalog-items-container');
  const footerStat = document.getElementById('catalog-footer-stat');
  const allMenus = getCombinedMenus(MENUS);

  const searchInput = document.getElementById('catalog-search-input');
  const query = (searchInput ? searchInput.value : '').trim().toLowerCase();

  let filtered = allMenus;

  // Apply tab filter
  if (activeCatalogFilter.startsWith('cuisine:')) {
    const cuisine = activeCatalogFilter.split(':')[1];
    filtered = filtered.filter(m => m.cuisine === cuisine);
  } else if (activeCatalogFilter.startsWith('type:')) {
    const type = activeCatalogFilter.split(':')[1];
    filtered = filtered.filter(m => m.dish_type === type);
  }

  // Apply search query
  if (query) {
    filtered = filtered.filter(m => {
      const matchName = m.name.toLowerCase().includes(query);
      const matchCuisine = m.cuisine.toLowerCase().includes(query);
      const matchType = m.dish_type.toLowerCase().includes(query);
      const matchProteins = (m.protein_groups || []).some(p => p.toLowerCase().includes(query));
      return matchName || matchCuisine || matchType || matchProteins;
    });
  }

  footerStat.textContent = `แสดง ${filtered.length} จากทั้งหมด ${allMenus.length} เมนู`;

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state-card" style="padding: 32px 16px;">
        <div class="empty-icon">🍳</div>
        <h4 class="empty-title">ไม่พบเมนูที่ตรงกับเงื่อนไข</h4>
        <p class="empty-desc">คุณสามารถกดปุ่ม "+ เพิ่มเมนูใหม่" ด้านบนเพื่อเพิ่มเข้าสู่ระบบได้เลย!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(m => {
    const typeClass = DISH_TYPE_CLASS[m.dish_type] || 'badge-type-side';
    const spicyBadge = m.spicy
      ? '<span class="badge badge-spicy">🌶️ เผ็ด</span>'
      : '<span class="badge badge-mild">🥬 ไม่เผ็ด</span>';
    const customBadge = m.is_custom
      ? '<span class="badge badge-custom">⭐ เมนูของคุณ</span>'
      : '';
    const deleteBtn = m.is_custom
      ? `
        <button type="button" class="btn-delete-row delete-custom-menu-btn" data-id="${m.id}" title="ลบเมนูนี้ออกจากระบบ">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      `
      : '';

    const proteinBadges = (m.protein_groups || [])
      .map(p => `<span class="badge badge-protein">${p}</span>`)
      .join('');

    return `
      <div class="catalog-dish-item" data-id="${m.id}">
        <div class="catalog-dish-details">
          <div class="dish-name-row">
            <span class="catalog-dish-name">${m.name}</span>
            ${customBadge}
          </div>
          <div class="badges-row">
            <span class="badge badge-country">${CUISINE_FLAGS[m.cuisine] || m.cuisine}</span>
            <span class="badge ${typeClass}">${m.dish_type}</span>
            ${spicyBadge}
            ${proteinBadges}
          </div>
        </div>
        ${deleteBtn}
      </div>
    `;
  }).join('');

  // Bind custom menu deletions
  container.querySelectorAll('.delete-custom-menu-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = btn.dataset.id;
      if (confirm('คุณต้องการลบเมนูนี้ออกจากระบบใช่หรือไม่?')) {
        deleteCustomMenu(id);
        renderCatalogList();
        updateHeaderCounts();
        showToast('🗑️ ลบเมนูออกจากระบบเรียบร้อย');
      }
    });
  });
}

function openCatalogModal() {
  const modal = document.getElementById('catalog-modal');
  const searchInput = document.getElementById('catalog-search-input');
  searchInput.value = '';
  document.getElementById('add-menu-form-panel').classList.remove('open');
  renderCatalogList();
  modal.classList.add('open');
}

function closeCatalogModal() {
  document.getElementById('catalog-modal').classList.remove('open');
}

function handleSaveNewMenu() {
  const nameInput = document.getElementById('new-menu-name');
  const name = nameInput.value.trim();
  if (!name) {
    alert('กรุณากรอกชื่อเมนูอาหาร');
    nameInput.focus();
    return;
  }

  const cuisine = document.getElementById('new-menu-cuisine').value;
  const dishType = document.getElementById('new-menu-type').value;
  const spicy = document.getElementById('new-menu-spicy').checked;
  const isPair = document.getElementById('new-menu-pair').checked;
  const proteins = [...document.querySelectorAll('[name=new-protein]:checked')].map(el => el.value);

  const newMenu = {
    name,
    cuisine,
    dish_type: dishType,
    spicy,
    is_pair: isPair,
    proteins: proteins.length ? proteins : ['ผัก'],
    protein_groups: proteins,
  };

  addCustomMenu(newMenu);

  // Reset form
  nameInput.value = '';
  document.getElementById('new-menu-spicy').checked = false;
  document.getElementById('new-menu-pair').checked = false;
  document.querySelectorAll('[name=new-protein]').forEach(cb => cb.checked = false);

  // Close form & re-render
  document.getElementById('add-menu-form-panel').classList.remove('open');
  renderCatalogList();
  updateHeaderCounts();
  showToast(`🎉 เพิ่มเมนู "${name}" ลงในระบบสำเร็จ!`);
}

// ─── Header Count Badges ───────────────────────────────────────────────────

function updateHeaderCounts() {
  const historyList = loadHistory();
  const allMenus = getCombinedMenus(MENUS);

  const histBadge = document.getElementById('header-history-count');
  if (histBadge) histBadge.textContent = historyList.length;

  const catBadge = document.getElementById('header-catalog-count');
  if (catBadge) catBadge.textContent = allMenus.length;
}

// ─── Initialization & Event Binding ─────────────────────────────────────────

function boot() {
  // Load settings into form controls
  const settings = loadSettings();
  applySettingsToForm(settings);
  updateHeaderCounts();

  // Segmented control buttons for meal count
  document.querySelectorAll('.segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const groupName = btn.getAttribute('name');
      document.querySelectorAll(`[name=${groupName}]`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      autoSaveSettings();
    });
  });

  // Auto-save on any checkbox change
  document.querySelectorAll('input[type=checkbox]').forEach(el => {
    el.addEventListener('change', autoSaveSettings);
  });

  // Quick Select All buttons for Protein & Cuisine chips
  document.querySelectorAll('.quick-select-all').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      const cbs = document.querySelectorAll(`[name=${target}]`);
      const allChecked = [...cbs].every(cb => cb.checked);
      cbs.forEach(cb => cb.checked = !allChecked);
      btn.textContent = allChecked ? 'เลือกทั้งหมด' : 'ยกเลิกทั้งหมด';
      autoSaveSettings();
    });
  });

  // Reset Defaults Button
  document.getElementById('btn-reset-defaults').addEventListener('click', () => {
    if (confirm('ต้องการคืนค่าตัวเลือกและเงื่อนไขกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      saveSettings(DEFAULT_SETTINGS);
      applySettingsToForm(DEFAULT_SETTINGS);
      showToast('↺ คืนค่าตัวเลือกเป็นค่าเริ่มต้นเรียบร้อย');
    }
  });

  // Hero Random Button
  document.getElementById('btn-random-hero').addEventListener('click', executeRandomRoll);

  // ─── History Modal Listeners ───
  document.getElementById('btn-open-history').addEventListener('click', openHistoryModal);
  document.getElementById('btn-close-history').addEventListener('click', closeHistoryModal);
  document.getElementById('history-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeHistoryModal();
  });

  const histSearch = document.getElementById('hist-search-input');
  histSearch.addEventListener('input', e => {
    const val = e.target.value;
    const wrap = histSearch.closest('.search-input-wrap');
    wrap.classList.toggle('has-value', Boolean(val));
    renderHistoryList(val);
  });

  document.getElementById('btn-clear-hist-search').addEventListener('click', () => {
    histSearch.value = '';
    histSearch.closest('.search-input-wrap').classList.remove('has-value');
    renderHistoryList('');
    histSearch.focus();
  });

  document.getElementById('btn-clear-all-history').addEventListener('click', () => {
    if (confirm('คุณต้องการล้างประวัติการสุ่มทั้งหมดใช่หรือไม่?')) {
      clearHistory();
      renderHistoryList('');
      updateHeaderCounts();
      showToast('🗑️ ล้างประวัติทั้งหมดแล้ว');
    }
  });

  // ─── Catalog Modal Listeners ───
  document.getElementById('btn-open-catalog').addEventListener('click', openCatalogModal);
  document.getElementById('btn-close-catalog').addEventListener('click', closeCatalogModal);
  document.getElementById('btn-catalog-close-bottom').addEventListener('click', closeCatalogModal);
  document.getElementById('catalog-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeCatalogModal();
  });

  const catSearch = document.getElementById('catalog-search-input');
  catSearch.addEventListener('input', e => {
    const val = e.target.value;
    const wrap = catSearch.closest('.search-input-wrap');
    wrap.classList.toggle('has-value', Boolean(val));
    renderCatalogList();
  });

  document.getElementById('btn-clear-cat-search').addEventListener('click', () => {
    catSearch.value = '';
    catSearch.closest('.search-input-wrap').classList.remove('has-value');
    renderCatalogList();
    catSearch.focus();
  });

  // Catalog Filter Tabs
  document.querySelectorAll('#catalog-tabs .cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#catalog-tabs .cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCatalogFilter = tab.dataset.filter;
      renderCatalogList();
    });
  });

  // Add Menu Form Toggles
  document.getElementById('btn-toggle-add-form').addEventListener('click', () => {
    const panel = document.getElementById('add-menu-form-panel');
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      document.getElementById('new-menu-name').focus();
    }
  });

  document.getElementById('btn-cancel-add-menu').addEventListener('click', () => {
    document.getElementById('add-menu-form-panel').classList.remove('open');
  });

  document.getElementById('btn-save-new-menu').addEventListener('click', handleSaveNewMenu);

  // Global ESC key listener to close modals
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeHistoryModal();
      closeCatalogModal();
    }
  });
}

document.addEventListener('DOMContentLoaded', boot);
