// app.js — Core Random Logic & UI Controller (Professional UI/UX Version)
import { MENUS, BASE_MENUS, PROTEIN_CATEGORIES, THAI_REGIONS, resolveDish } from '../data/menus.js';
import {
  loadSettings, saveSettings,
  loadHistory, addHistory, removeHistoryItem, removeHistoryById, clearHistory, isInHistory,
  loadCustomMenus, addCustomMenu, deleteCustomMenu, getCombinedMenus, getCombinedBaseMenus,
  DEFAULT_SETTINGS,
} from './storage.js';

const CURRENT_ROLL_KEY = 'rm_current_roll';

// ─── State ──────────────────────────────────────────────────────────────────

let currentMorning = [];
let currentEvening = [];
let activeCatalogFilter = 'all';
let activeProteinCat = 'all';

// ─── Utility ────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showToast(message, duration = 2400) {
  const toast = document.getElementById('app-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

function saveCurrentRollState() {
  try {
    localStorage.setItem(CURRENT_ROLL_KEY, JSON.stringify({
      morning: currentMorning,
      evening: currentEvening,
    }));
  } catch {}
}

function loadSavedRollState() {
  try {
    const raw = localStorage.getItem(CURRENT_ROLL_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── Filter & Add-on Logic ──────────────────────────────────────────────────

function getEligibleBaseMenus(slotSettings, globalSettings, excludeBaseIds = []) {
  const allBases = getCombinedBaseMenus(BASE_MENUS);
  const { no_spicy, dish_types } = slotSettings;
  const { no_repeat_30d, specific_cuts, cuisines, regions } = globalSettings;

  return allBases.filter(b => {
    // Exclude base if already in use in this round
    if (excludeBaseIds.includes(b.id)) return false;

    // Filter dish_type for this meal slot
    if (dish_types && dish_types.length && !dish_types.includes(b.dish_type)) {
      return false;
    }

    // Filter spicy
    if (no_spicy && b.spicy) return false;

    // Filter cuisine
    if (cuisines && (!cuisines.includes(b.cuisine) || cuisines.length === 0)) return false;

    // Filter region for Thai cuisine (Thai regions are strictly a subset of Thai cuisine)
    if (b.cuisine === 'ไทย') {
      if (!regions || regions.length === 0) return false;
      if (b.region && !regions.includes(b.region)) return false;
    }

    // Filter specific meat cuts:
    // Base dish must have at least one allowed protein matching user's filter
    const allowed = b.allowed_proteins && b.allowed_proteins.length ? b.allowed_proteins : ['ผัก'];
    if (specific_cuts && specific_cuts.length > 0) {
      const match = allowed.some(cut => specific_cuts.includes(cut));
      if (!match) return false;
    }

    // Filter 30-day repetition
    if (no_repeat_30d && (isInHistory(b.id) || isInHistory(`${b.id}_base`))) {
      return false;
    }

    return true;
  });
}

function pickProteinForBase(baseDish, specific_cuts = [], excludeProtein = null) {
  let candidates = [...(baseDish.allowed_proteins || ['ผัก'])];

  // If specific cuts filter is active, only pick matching cuts
  if (specific_cuts && specific_cuts.length > 0) {
    const matching = candidates.filter(p => specific_cuts.includes(p));
    if (matching.length > 0) candidates = matching;
  }

  // If excludeProtein provided, try to avoid picking the exact same protein
  if (excludeProtein && candidates.length > 1) {
    const diff = candidates.filter(p => p !== excludeProtein);
    if (diff.length > 0) candidates = diff;
  }

  if (!candidates.length) return 'ผัก';
  return shuffle(candidates)[0];
}

function pickMultiple(slotSettings, globalSettings, excludeBaseIds = [], ensurePairSoup = false) {
  const count = slotSettings.count;
  if (count <= 0) return [];

  const currentExclude = [...excludeBaseIds];
  const pickedBases = [];

  // 1. Guarantee soup/curry dish if requested (การันตีต้มจืดหรือแกง)
  if (ensurePairSoup) {
    // Specifically query for soup dishes regardless of what general dish_types were selected
    const soupSettings = {
      ...slotSettings,
      dish_types: ['ต้ม/แกง'],
    };
    const soupCandidates = shuffle(getEligibleBaseMenus(soupSettings, globalSettings, currentExclude));
    if (soupCandidates.length > 0) {
      const pickedSoup = soupCandidates[0];
      pickedBases.push(pickedSoup);
      currentExclude.push(pickedSoup.id);
    }
  }

  // 2. Fill remaining dishes (count - pickedBases.length)
  const remainingCount = count - pickedBases.length;
  if (remainingCount > 0) {
    let regularCandidates = shuffle(getEligibleBaseMenus(slotSettings, globalSettings, currentExclude));

    // Fallback: If regular candidates are insufficient, relax dish_types constraint
    if (regularCandidates.length < remainingCount) {
      const relaxedSettings = { ...slotSettings, dish_types: [] };
      regularCandidates = shuffle(getEligibleBaseMenus(relaxedSettings, globalSettings, currentExclude));
    }

    while (pickedBases.length < count && regularCandidates.length > 0) {
      const picked = regularCandidates.pop();
      pickedBases.push(picked);
      currentExclude.push(picked.id);
    }
  }

  // 3. Resolve each base dish with a selected protein
  return pickedBases.map(b => {
    const protein = pickProteinForBase(b, globalSettings.specific_cuts || []);
    return resolveDish(b, protein);
  });
}

// ─── UI Rendering (Clean Professional Style) ────────────────────────────────

const CUISINE_LABELS = {
  ไทย: 'อาหารไทย',
  จีน: 'อาหารจีน',
  ญี่ปุ่น: 'อาหารญี่ปุ่น',
  ฝรั่ง: 'อาหารตะวันตก',
};

const REGION_CLASSES = {
  กลาง: 'badge-region-central',
  อีสาน: 'badge-region-isan',
  เหนือ: 'badge-region-north',
  ใต้: 'badge-region-south',
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
    ? '<span class="badge badge-spicy"><span class="dot dot-red"></span>รสเผ็ด</span>'
    : '<span class="badge badge-mild"><span class="dot dot-green"></span>ไม่เผ็ด</span>';
    
  const customBadge = menu.is_custom
    ? '<span class="badge badge-custom">เมนูของคุณ</span>'
    : '';

  const regionBadge = (menu.cuisine === 'ไทย' && menu.region)
    ? `<span class="badge badge-region ${REGION_CLASSES[menu.region] || ''}">ภาค${menu.region}</span>`
    : '';

  const currentCut = menu.selectedProtein || (menu.proteins && menu.proteins[0]) || 'ผัก';
  const cutBadge = `<span class="badge badge-cut">${currentCut}</span>`;

  const canSwapProtein = menu.allowed_proteins && menu.allowed_proteins.length > 1;

  return `
    <div class="result-dish-card ${isMorning ? 'morning-card' : 'evening-card'}" 
         data-id="${menu.id}" data-base-id="${menu.baseId}" data-meal="${mealType}">
      <div class="dish-info">
        <div class="dish-name-row">
          <span class="dish-name">${menu.name}</span>
          ${customBadge}
        </div>
        <div class="badges-row">
          <span class="badge badge-country">${CUISINE_LABELS[menu.cuisine] || menu.cuisine}</span>
          ${regionBadge}
          <span class="badge ${typeClass}">${menu.dish_type}</span>
          ${spicyBadge}
          ${cutBadge}
        </div>
      </div>
      <div class="dish-actions-wrap">
        <button type="button" class="btn-action-reroll btn-reroll-protein" 
                data-id="${menu.id}" data-base-id="${menu.baseId}" data-meal="${mealType}"
                ${canSwapProtein ? '' : 'disabled'}
                title="${canSwapProtein ? 'สุ่มเปลี่ยนเฉพาะวัตถุดิบ/เนื้อสัตว์' : 'เมนูนี้มีวัตถุดิบเฉพาะ'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          <span>เปลี่ยนเนื้อสัตว์</span>
        </button>
        <button type="button" class="btn-action-reroll btn-reroll-dish" 
                data-id="${menu.id}" data-base-id="${menu.baseId}" data-meal="${mealType}"
                title="สุ่มเปลี่ยนทั้งเมนู">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
            <path d="M16 21h5v-5"></path>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          <span>สุ่มเมนูใหม่</span>
        </button>
      </div>
    </div>
  `;
}

function bindDishCardActions(rootEl) {
  rootEl.querySelectorAll('.btn-reroll-dish').forEach(btn => {
    btn.addEventListener('click', handleRerollDish);
  });
  rootEl.querySelectorAll('.btn-reroll-protein').forEach(btn => {
    btn.addEventListener('click', handleRerollProtein);
  });
}

function renderResults(morningMenus, eveningMenus) {
  const container = document.getElementById('results-content');
  if (!container) return;

  if (!morningMenus.length && !eveningMenus.length) {
    container.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <h3 class="empty-title">ไม่พบเมนูอาหารที่ตรงตามเงื่อนไข</h3>
        <p class="empty-desc">ลองปลดล็อคชิ้นส่วนวัตถุดิบ หรือยกเลิกการเลือก "ไม่ซ้ำ 30 วัน" เพื่อเปิดรับรายการอาหารที่กว้างขึ้น</p>
      </div>
    `;
    return;
  }

  let html = '';

  if (morningMenus.length) {
    html += `
      <div class="meal-result-group" id="group-morning">
        <div class="meal-result-header">
          <div class="meal-title-group">
            <span class="meal-indicator-bar morning-bar"></span>
            <h3 class="meal-result-title morning-text">มื้อเช้า</h3>
          </div>
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
      <div class="meal-result-group" id="group-evening">
        <div class="meal-result-header">
          <div class="meal-title-group">
            <span class="meal-indicator-bar evening-bar"></span>
            <h3 class="meal-result-title evening-text">มื้อเย็น</h3>
          </div>
          <span class="dish-count-tag">${eveningMenus.length} เมนู</span>
        </div>
        <div class="dish-cards-list">
          ${eveningMenus.map(m => renderDishCard(m, 'evening')).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
  bindDishCardActions(container);
}

// ─── Dual Reroll Handlers (In-Place DOM Replacement) ───────────────────────

function handleRerollDish(event) {
  const btn = event.currentTarget;
  const oldId = btn.dataset.id;
  const oldBaseId = btn.dataset.baseId;
  const meal = btn.dataset.meal;
  const cardEl = btn.closest('.result-dish-card');
  if (!cardEl) return;

  const settings = readFormSettings();

  // 1. Remove old dish from history
  removeHistoryById(oldId);
  removeHistoryById(oldBaseId);

  // 2. Identify currently displayed base IDs
  const currentDisplayedBaseIds = [
    ...currentMorning.map(m => m.baseId),
    ...currentEvening.map(m => m.baseId),
  ];

  // 3. Pick replacement base dish
  const slotSettings = meal === 'morning' ? settings.morning : settings.evening;
  const currentList = meal === 'morning' ? currentMorning : currentEvening;
  const oldDish = currentList.find(m => m.id === oldId || m.baseId === oldBaseId);
  const isSoupDish = oldDish && (oldDish.dish_type === 'ต้ม/แกง' || oldDish.is_pair);

  let rerollSettings = slotSettings;
  // If this meal requires a guaranteed soup and this was the soup dish, replace it with another soup!
  if (slotSettings.pair_soup && isSoupDish) {
    rerollSettings = { ...slotSettings, dish_types: ['ต้ม/แกง'] };
  }

  const candidateBases = getEligibleBaseMenus(rerollSettings, settings.global, currentDisplayedBaseIds);

  if (!candidateBases.length) {
    showToast('ไม่มีเมนูอื่นที่ตรงกับเงื่อนไขที่เลือก');
    return;
  }

  const newBase = shuffle(candidateBases)[0];
  const newProtein = pickProteinForBase(newBase, settings.global.specific_cuts || []);
  const replacement = resolveDish(newBase, newProtein);

  // 4. Update in-memory state
  if (meal === 'morning') {
    const idx = currentMorning.findIndex(m => m.id === oldId || m.baseId === oldBaseId);
    if (idx !== -1) currentMorning[idx] = replacement;
  } else {
    const idx = currentEvening.findIndex(m => m.id === oldId || m.baseId === oldBaseId);
    if (idx !== -1) currentEvening[idx] = replacement;
  }

  // 5. Add new menu to history
  addHistory([{ id: replacement.id, baseId: replacement.baseId, name: replacement.name, meal }]);

  // 6. In-place DOM Replacement
  const temp = document.createElement('div');
  temp.innerHTML = renderDishCard(replacement, meal);
  const newCardEl = temp.firstElementChild;

  cardEl.classList.add('replacing-card');

  setTimeout(() => {
    cardEl.replaceWith(newCardEl);
    bindDishCardActions(newCardEl);
    saveCurrentRollState();
    updateHeaderCounts();
    showToast(`เปลี่ยนเมนูเป็น: ${replacement.name}`);
  }, 120);
}

function handleRerollProtein(event) {
  const btn = event.currentTarget;
  if (btn.disabled) return;

  const dishId = btn.dataset.id;
  const baseId = btn.dataset.baseId;
  const meal = btn.dataset.meal;
  const cardEl = btn.closest('.result-dish-card');
  if (!cardEl) return;

  const currentList = meal === 'morning' ? currentMorning : currentEvening;
  const currentIdx = currentList.findIndex(m => m.id === dishId || m.baseId === baseId);
  if (currentIdx === -1) return;

  const currentMenu = currentList[currentIdx];
  const allBases = getCombinedBaseMenus(BASE_MENUS);
  const baseDish = allBases.find(b => b.id === currentMenu.baseId);

  if (!baseDish || !baseDish.allowed_proteins || baseDish.allowed_proteins.length <= 1) {
    showToast('เมนูนี้มีวัตถุดิบเฉพาะ ไม่สามารถเปลี่ยนเนื้อสัตว์ได้');
    return;
  }

  const settings = readFormSettings();
  const currentProtein = currentMenu.selectedProtein;

  // Filter candidates matching user's specific cuts filter (if active)
  let candidateProteins = baseDish.allowed_proteins.filter(p => p !== currentProtein);
  if (settings.global.specific_cuts && settings.global.specific_cuts.length > 0) {
    const matching = candidateProteins.filter(p => settings.global.specific_cuts.includes(p));
    if (matching.length > 0) candidateProteins = matching;
  }

  if (!candidateProteins.length) {
    showToast('ไม่มีวัตถุดิบอื่นที่ตรงกับเงื่อนไขที่เลือก');
    return;
  }

  const newProtein = shuffle(candidateProteins)[0];
  const updatedMenu = resolveDish(baseDish, newProtein);

  // Update in-memory state
  if (meal === 'morning') {
    currentMorning[currentIdx] = updatedMenu;
  } else {
    currentEvening[currentIdx] = updatedMenu;
  }

  // Update history
  removeHistoryById(currentMenu.id);
  addHistory([{ id: updatedMenu.id, baseId: updatedMenu.baseId, name: updatedMenu.name, meal }]);

  // In-place replacement with highlight animation
  const temp = document.createElement('div');
  temp.innerHTML = renderDishCard(updatedMenu, meal);
  const newCardEl = temp.firstElementChild;
  newCardEl.classList.add('protein-swapped');

  cardEl.replaceWith(newCardEl);
  bindDishCardActions(newCardEl);

  saveCurrentRollState();
  updateHeaderCounts();
  showToast(`เปลี่ยนเนื้อสัตว์เป็น: ${newProtein} (${updatedMenu.name})`);
}

// ─── Main Random Roll Action ────────────────────────────────────────────────

function executeRandomRoll() {
  const settings = readFormSettings();
  saveSettings(settings);

  // 1. Roll for morning (support morning pair soup e.g. แกงจืด / ซุปใส)
  const morningList = pickMultiple(
    settings.morning,
    settings.global,
    [],
    settings.morning.pair_soup
  );

  // 2. Roll for evening (exclude morning base dishes to prevent duplicate base dishes in one day)
  const excludeForEvening = morningList.map(m => m.baseId);
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
    ...morningList.map(m => ({ id: m.id, baseId: m.baseId, name: m.name, meal: 'morning' })),
    ...eveningList.map(m => ({ id: m.id, baseId: m.baseId, name: m.name, meal: 'evening' })),
  ];
  if (historyBatch.length) {
    addHistory(historyBatch);
  }

  // 4. Render results & update header
  renderResults(morningList, eveningList);
  saveCurrentRollState();
  updateHeaderCounts();

  showToast(`สุ่มเมนูสำเร็จ รวม ${morningList.length + eveningList.length} รายการ`);

  // Scroll smoothly to results right below
  document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ─── Settings Form Read & Apply ─────────────────────────────────────────────

function readFormSettings() {
  const morningCountBtn = document.querySelector('[name=morning-count].active');
  const eveningCountBtn = document.querySelector('[name=evening-count].active');

  const morningTypes = [...document.querySelectorAll('[name=morning-types]:checked')].map(el => el.value);
  const eveningTypes = [...document.querySelectorAll('[name=evening-types]:checked')].map(el => el.value);

  const selectedCuts = [...document.querySelectorAll('[name=specific-cut]:checked')].map(el => el.value);
  const selectedCuisines = [...document.querySelectorAll('[name=cuisine]:checked')].map(el => el.value);
  const selectedRegions = [...document.querySelectorAll('[name=thai-region]:checked')].map(el => el.value);

  return {
    morning: {
      count: parseInt(morningCountBtn ? morningCountBtn.dataset.val : '2', 10),
      no_spicy: document.getElementById('morning-no-spicy').checked,
      dish_types: morningTypes.length ? morningTypes : ['กับข้าว', 'ต้ม/แกง'],
      pair_soup: document.getElementById('morning-pair-soup') ? document.getElementById('morning-pair-soup').checked : false,
    },
    evening: {
      count: parseInt(eveningCountBtn ? eveningCountBtn.dataset.val : '2', 10),
      no_spicy: document.getElementById('evening-no-spicy').checked,
      dish_types: eveningTypes.length ? eveningTypes : ['กับข้าว', 'ต้ม/แกง', 'จานเดียว'],
      pair_soup: document.getElementById('evening-pair-soup').checked,
    },
    global: {
      no_repeat_30d: document.getElementById('global-no-repeat').checked,
      specific_cuts: selectedCuts,
      cuisines: selectedCuisines,
      regions: selectedRegions,
      dish_types: [],
    },
  };
}

function syncThaiCuisineAndRegions(triggeredBy = 'cuisine') {
  const thaiCuisineCb = document.getElementById('chk-cuisine-thai') || document.querySelector('[name=cuisine][value="ไทย"]');
  const regionBlock = document.getElementById('thai-region-filter-block');
  const regionCbs = [...document.querySelectorAll('[name=thai-region]')];
  const btnRegionAll = document.getElementById('btn-select-all-thai-regions');
  if (!thaiCuisineCb || !regionBlock) return;

  if (triggeredBy === 'cuisine') {
    const isThaiChecked = thaiCuisineCb.checked;
    regionBlock.classList.toggle('disabled-sub-block', !isThaiChecked);
    regionCbs.forEach(cb => {
      cb.disabled = !isThaiChecked;
      if (!isThaiChecked) {
        cb.checked = false;
      }
    });
    if (isThaiChecked) {
      const anyChecked = regionCbs.some(cb => cb.checked);
      if (!anyChecked) {
        regionCbs.forEach(cb => cb.checked = true);
      }
    }
    const allChecked = regionCbs.every(cb => cb.checked);
    if (btnRegionAll) {
      btnRegionAll.textContent = allChecked ? 'ยกเลิกทุกภาค' : 'เลือกทุกภาค';
    }
  } else if (triggeredBy === 'region') {
    const checkedCount = regionCbs.filter(cb => cb.checked).length;
    if (checkedCount > 0) {
      thaiCuisineCb.checked = true;
      regionBlock.classList.remove('disabled-sub-block');
      regionCbs.forEach(cb => cb.disabled = false);
      if (btnRegionAll) {
        btnRegionAll.textContent = checkedCount === regionCbs.length ? 'ยกเลิกทุกภาค' : 'เลือกทุกภาค';
      }
    } else {
      thaiCuisineCb.checked = false;
      regionBlock.classList.add('disabled-sub-block');
      regionCbs.forEach(cb => {
        cb.checked = false;
        cb.disabled = true;
      });
      if (btnRegionAll) {
        btnRegionAll.textContent = 'เลือกทุกภาค';
      }
    }
  }
}

function applySettingsToForm(s) {
  // Morning count
  document.querySelectorAll('[name=morning-count]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === String(s.morning.count));
  });
  document.getElementById('morning-no-spicy').checked = Boolean(s.morning.no_spicy);
  if (document.getElementById('morning-pair-soup')) {
    document.getElementById('morning-pair-soup').checked = Boolean(s.morning.pair_soup);
  }
  document.querySelectorAll('[name=morning-types]').forEach(cb => {
    cb.checked = s.morning.dish_types ? s.morning.dish_types.includes(cb.value) : false;
  });

  // Evening count
  document.querySelectorAll('[name=evening-count]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === String(s.evening.count));
  });
  document.getElementById('evening-no-spicy').checked = Boolean(s.evening.no_spicy);
  document.getElementById('evening-pair-soup').checked = Boolean(s.evening.pair_soup);
  document.querySelectorAll('[name=evening-types]').forEach(cb => {
    cb.checked = s.evening.dish_types ? s.evening.dish_types.includes(cb.value) : false;
  });

  // Global preferences
  document.getElementById('global-no-repeat').checked = Boolean(s.global.no_repeat_30d);

  document.querySelectorAll('[name=cuisine]').forEach(cb => {
    cb.checked = s.global.cuisines && s.global.cuisines.length ? s.global.cuisines.includes(cb.value) : true;
  });

  // Thai regions
  document.querySelectorAll('[name=thai-region]').forEach(cb => {
    cb.checked = s.global.regions && s.global.regions.length ? s.global.regions.includes(cb.value) : true;
  });

  // Specific cuts
  document.querySelectorAll('[name=specific-cut]').forEach(cb => {
    cb.checked = s.global.specific_cuts ? s.global.specific_cuts.includes(cb.value) : false;
  });

  syncThaiCuisineAndRegions('cuisine');
  updateCutsSummary();
  checkIfSettingsAreDefault();
}

function checkIfSettingsAreDefault() {
  const current = readFormSettings();
  const def = DEFAULT_SETTINGS;

  const hasAllRegions = current.global.regions && current.global.regions.length === 4;
  const hasAllCuisines = current.global.cuisines && current.global.cuisines.length === 4;

  const isDefault =
    current.morning.count === def.morning.count &&
    current.morning.no_spicy === def.morning.no_spicy &&
    Boolean(current.morning.pair_soup) === false &&
    current.morning.dish_types.length === 1 &&
    current.morning.dish_types.includes('กับข้าว') &&
    current.evening.count === def.evening.count &&
    current.evening.no_spicy === def.evening.no_spicy &&
    Boolean(current.evening.pair_soup) === false &&
    current.evening.dish_types.length === 1 &&
    current.evening.dish_types.includes('กับข้าว') &&
    current.global.no_repeat_30d === def.global.no_repeat_30d &&
    current.global.specific_cuts.length === 0 &&
    hasAllRegions &&
    hasAllCuisines;

  const defChk = document.getElementById('chk-use-default');
  if (defChk) defChk.checked = isDefault;
}

function autoSaveSettings() {
  saveSettings(readFormSettings());
  updateCutsSummary();
  checkIfSettingsAreDefault();
}

function resetToDefault() {
  saveSettings(DEFAULT_SETTINGS);
  applySettingsToForm(DEFAULT_SETTINGS);
  const defChk = document.getElementById('chk-use-default');
  if (defChk) defChk.checked = true;
  showToast('คืนค่าเริ่มต้นเรียบร้อย');
}

// ─── Granular Protein Cuts UI Builder & Context Menu ────────────────────────

let currentContextCut = null;

function showCutContextMenu(x, y, cutId, cutLabel, catKey) {
  currentContextCut = { cutId, cutLabel, catKey };
  const menu = document.getElementById('cut-context-menu');
  if (!menu) return;

  const titleEl = document.getElementById('ctx-menu-title');
  if (titleEl) titleEl.textContent = `วัตถุดิบ: ${cutLabel}`;

  const descEl = document.getElementById('ctx-search-desc');
  if (descEl) descEl.textContent = `ดูรายการเมนูทั้งหมดที่มี ${cutLabel} ในคลัง`;

  menu.style.display = 'block';
  const rect = menu.getBoundingClientRect();
  let posX = x;
  let posY = y;
  if (posX + rect.width > window.innerWidth - 10) {
    posX = window.innerWidth - rect.width - 10;
  }
  if (posY + rect.height > window.innerHeight - 10) {
    posY = window.innerHeight - rect.height - 10;
  }
  menu.style.left = `${posX}px`;
  menu.style.top = `${posY}px`;
}

function hideCutContextMenu() {
  const menu = document.getElementById('cut-context-menu');
  if (menu) menu.style.display = 'none';
  currentContextCut = null;
}

function renderCutsChips() {
  const container = document.getElementById('cuts-chips-container');
  if (!container) return;

  const allBases = getCombinedBaseMenus(BASE_MENUS);
  const savedSettings = loadSettings();
  const selectedCuts = savedSettings.global.specific_cuts || [];

  let html = '';

  for (const [catKey, catData] of Object.entries(PROTEIN_CATEGORIES)) {
    const isVisible = activeProteinCat === 'all' || activeProteinCat === catKey;
    const hideClass = isVisible ? '' : 'style="display:none;"';

    html += `<div class="cuts-category-group" data-cat="${catKey}" ${hideClass}>`;
    html += `
      <div class="cuts-group-header">
        <span class="cuts-group-title">${catData.label}</span>
        <button type="button" class="btn-select-group" data-cat="${catKey}">เลือกทั้งหมวดนี้</button>
      </div>
    `;
    html += `<div class="chips-grid cuts-chips-grid">`;

    catData.cuts.forEach(cut => {
      // Calculate count of base menus that can use this cut
      const count = allBases.filter(b => {
        const allowed = b.allowed_proteins || ['ผัก'];
        if (cut.id === 'ผัก') {
          return allowed.includes('ผัก');
        }
        return allowed.includes(cut.id) || (b.base_name && b.base_name.includes(cut.id));
      }).length;

      const isChecked = selectedCuts.includes(cut.id);

      html += `
        <label class="chip-item cut-chip-item" data-cut-id="${cut.id}" data-cut-label="${cut.label}" data-cat="${catKey}" title="คลิกเลือก / คลิกขวาเพื่อค้นหาในคลังอาหาร">
          <input type="checkbox" name="specific-cut" data-cat="${catKey}" value="${cut.id}" ${isChecked ? 'checked' : ''} />
          <span class="chip-label">
            <span class="cut-name">${cut.label}</span>
            <span class="cut-count">${count}</span>
          </span>
        </label>
      `;
    });

    html += `</div></div>`;
  }

  container.innerHTML = html;

  // Bind change listeners to newly rendered cut checkboxes
  container.querySelectorAll('[name=specific-cut]').forEach(cb => {
    cb.addEventListener('change', autoSaveSettings);
  });

  // Bind right-click context menu to cut chips
  container.querySelectorAll('.cut-chip-item').forEach(item => {
    item.addEventListener('contextmenu', e => {
      e.preventDefault();
      const cutId = item.dataset.cutId;
      const cutLabel = item.dataset.cutLabel;
      const catKey = item.dataset.cat;
      showCutContextMenu(e.clientX, e.clientY, cutId, cutLabel, catKey);
    });
  });

  // Bind "เลือกทั้งหมวดนี้" button
  container.querySelectorAll('.btn-select-group').forEach(btn => {
    btn.addEventListener('click', () => {
      const catKey = btn.dataset.cat;
      const cbs = container.querySelectorAll(`[name=specific-cut][data-cat="${catKey}"]`);
      const allChecked = [...cbs].every(cb => cb.checked);
      cbs.forEach(cb => cb.checked = !allChecked);
      btn.textContent = allChecked ? 'เลือกทั้งหมวดนี้' : 'ยกเลิกหมวดนี้';
      autoSaveSettings();
    });
  });
}

function updateCutsSummary() {
  const summaryEl = document.getElementById('cuts-summary-badge');
  if (!summaryEl) return;

  const checkedCuts = [...document.querySelectorAll('[name=specific-cut]:checked')].map(el => el.value);
  if (checkedCuts.length === 0) {
    summaryEl.textContent = 'ทุกวัตถุดิบ (ไม่จำกัด)';
    summaryEl.classList.remove('has-filter');
  } else if (checkedCuts.length <= 3) {
    summaryEl.textContent = `เจาะจง: ${checkedCuts.join(', ')}`;
    summaryEl.classList.add('has-filter');
  } else {
    summaryEl.textContent = `เจาะจง ${checkedCuts.length} ชิ้นส่วน`;
    summaryEl.classList.add('has-filter');
  }
}

function renderNewMenuProteinOptions() {
  const container = document.getElementById('new-menu-protein-options');
  if (!container) return;

  let html = '';
  for (const [catKey, catData] of Object.entries(PROTEIN_CATEGORIES)) {
    catData.cuts.forEach(cut => {
      html += `
        <label class="chip-item">
          <input type="checkbox" name="new-cut" value="${cut.id}" />
          <span class="chip-label">${cut.label}</span>
        </label>
      `;
    });
  }
  container.innerHTML = html;
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
        <div class="empty-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
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
      const mealClass = h.meal === 'morning' ? 'morning-tag' : 'evening-tag';
      const mealText = h.meal === 'morning' ? 'มื้อเช้า' : 'มื้อเย็น';
      const timeStr = h.ts ? new Date(h.ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '';

      html += `
        <div class="hist-item-row" data-id="${h.id}" data-ts="${h.ts}">
          <div class="hist-item-content">
            <span class="meal-tag-pill ${mealClass}">${mealText}</span>
            <div class="hist-item-details">
              <span class="hist-dish-name">${h.name}</span>
              <span class="hist-time-tag">${timeStr}</span>
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
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const ts = btn.dataset.ts;
      removeHistoryItem(id, ts);
      renderHistoryList(document.getElementById('hist-search-input').value);
      updateHeaderCounts();
      showToast('ลบรายการออกจากประวัติแล้ว');
    });
  });
}

function openConfigModal() {
  const modal = document.getElementById('config-modal');
  if (modal) modal.classList.add('open');
}

function closeConfigModal() {
  const modal = document.getElementById('config-modal');
  if (modal) modal.classList.remove('open');
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
  } else if (activeCatalogFilter.startsWith('region:')) {
    const reg = activeCatalogFilter.split(':')[1];
    filtered = filtered.filter(m => m.cuisine === 'ไทย' && m.region === reg);
  } else if (activeCatalogFilter.startsWith('type:')) {
    const type = activeCatalogFilter.split(':')[1];
    filtered = filtered.filter(m => m.dish_type === type);
  } else if (activeCatalogFilter.startsWith('cut:')) {
    const cut = activeCatalogFilter.split(':')[1];
    filtered = filtered.filter(m => (m.proteins && m.proteins.includes(cut)) || m.name.includes(cut));
  }

  // Apply search query
  if (query) {
    filtered = filtered.filter(m => {
      const matchName = m.name.toLowerCase().includes(query);
      const matchCuisine = m.cuisine.toLowerCase().includes(query);
      const matchRegion = m.region && (m.region.toLowerCase().includes(query) || `ภาค${m.region}`.toLowerCase().includes(query));
      const matchType = m.dish_type.toLowerCase().includes(query);
      const matchProteins = (m.proteins || []).some(p => {
        if (query === 'มังสวิรัติ' && (p === 'ผัก' || p === 'เต้าหู้')) return true;
        if (query === 'ผัก' && (p === 'ผัก' || p === 'เต้าหู้' || p === 'เห็ด')) return true;
        return p.toLowerCase().includes(query);
      });
      return matchName || matchCuisine || matchRegion || matchType || matchProteins;
    });
  }

  footerStat.textContent = `แสดง ${filtered.length} จากทั้งหมด ${allMenus.length} เมนู`;

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state-card" style="padding: 32px 16px;">
        <div class="empty-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h4 class="empty-title">ไม่พบเมนูที่ตรงกับเงื่อนไข</h4>
        <p class="empty-desc">คุณสามารถกดปุ่ม "เพิ่มเมนูใหม่" ด้านบนเพื่อเพิ่มเข้าสู่ระบบได้ทันที</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(m => {
    const typeClass = DISH_TYPE_CLASS[m.dish_type] || 'badge-type-side';
    const spicyBadge = m.spicy
      ? '<span class="badge badge-spicy"><span class="dot dot-red"></span>รสเผ็ด</span>'
      : '<span class="badge badge-mild"><span class="dot dot-green"></span>ไม่เผ็ด</span>';
    const customBadge = m.is_custom
      ? '<span class="badge badge-custom">เมนูของคุณ</span>'
      : '';
    const regionBadge = (m.cuisine === 'ไทย' && m.region)
      ? `<span class="badge badge-region ${REGION_CLASSES[m.region] || ''}">ภาค${m.region}</span>`
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

    const cutBadges = (m.proteins && m.proteins.length ? m.proteins : m.protein_groups || [])
      .map(p => `<span class="badge badge-cut">${p}</span>`)
      .join('');

    return `
      <div class="catalog-dish-item" data-id="${m.id}">
        <div class="catalog-dish-details">
          <div class="dish-name-row">
            <span class="catalog-dish-name">${m.name}</span>
            ${customBadge}
          </div>
          <div class="badges-row">
            <span class="badge badge-country">${CUISINE_LABELS[m.cuisine] || m.cuisine}</span>
            ${regionBadge}
            <span class="badge ${typeClass}">${m.dish_type}</span>
            ${spicyBadge}
            ${cutBadges}
          </div>
        </div>
        ${deleteBtn}
      </div>
    `;
  }).join('');

  // Bind custom menu deletions
  container.querySelectorAll('.delete-custom-menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (confirm('คุณต้องการลบเมนูนี้ออกจากระบบใช่หรือไม่?')) {
        deleteCustomMenu(id);
        renderCatalogList();
        renderCutsChips();
        updateHeaderCounts();
        showToast('ลบเมนูออกจากระบบเรียบร้อย');
      }
    });
  });
}

function openCatalogModal(initialQuery = '') {
  const modal = document.getElementById('catalog-modal');
  const searchInput = document.getElementById('catalog-search-input');
  searchInput.value = initialQuery;
  const wrap = searchInput.closest('.search-input-wrap');
  if (wrap) wrap.classList.toggle('has-value', Boolean(initialQuery));
  document.getElementById('add-menu-form-panel').classList.remove('open');
  renderCatalogList();
  modal.classList.add('open');
  if (initialQuery) {
    searchInput.focus();
    searchInput.select();
  }
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
  const regionSelect = document.getElementById('new-menu-region');
  const region = cuisine === 'ไทย' && regionSelect ? regionSelect.value : null;
  const dishType = document.getElementById('new-menu-type').value;
  const spicy = document.getElementById('new-menu-spicy').checked;
  // Automatically identify if dish is a soup/curry pair
  const isPair = dishType === 'ต้ม/แกง';
  const selectedCuts = [...document.querySelectorAll('[name=new-cut]:checked')].map(el => el.value);

  // Derive protein groups
  const groups = new Set();
  for (const [groupName, groupData] of Object.entries(PROTEIN_CATEGORIES)) {
    if (groupData.cuts.some(c => selectedCuts.includes(c.id))) {
      groups.add(groupName);
    }
  }

  const newMenu = {
    name,
    base_name: name,
    name_template: name.includes('{protein}') ? name : `${name}{protein}`,
    cuisine,
    region,
    dish_type: dishType,
    spicy,
    is_pair: isPair,
    allowed_proteins: selectedCuts.length ? selectedCuts : ['ผัก'],
    proteins: selectedCuts.length ? selectedCuts : ['ผัก'],
    protein_groups: Array.from(groups),
  };

  addCustomMenu(newMenu);

  // Reset form
  nameInput.value = '';
  document.getElementById('new-menu-spicy').checked = false;
  document.querySelectorAll('[name=new-cut]').forEach(cb => cb.checked = false);

  // Close form & re-render
  document.getElementById('add-menu-form-panel').classList.remove('open');
  renderCatalogList();
  renderCutsChips();
  updateHeaderCounts();
  showToast(`เพิ่มเมนู "${name}" ลงในระบบสำเร็จ`);
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
  // Render granular cuts chips
  renderCutsChips();
  renderNewMenuProteinOptions();

  // Load settings into form controls
  const settings = loadSettings();
  applySettingsToForm(settings);
  updateHeaderCounts();

  // Restore saved roll state from session if available
  const savedRoll = loadSavedRollState();
  if (savedRoll && (savedRoll.morning?.length || savedRoll.evening?.length)) {
    currentMorning = savedRoll.morning || [];
    currentEvening = savedRoll.evening || [];
    renderResults(currentMorning, currentEvening);
  }

  // Segmented control buttons for meal count
  document.querySelectorAll('.segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const groupName = btn.getAttribute('name');
      document.querySelectorAll(`[name=${groupName}]`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      autoSaveSettings();
    });
  });

  // Checkbox changes for dish types and options (only inside config modal)
  document.querySelectorAll('#config-modal input[type=checkbox]').forEach(el => {
    el.addEventListener('change', autoSaveSettings);
  });

  // Quick Default Toggle Checkbox
  const defaultToggle = document.getElementById('chk-use-default');
  if (defaultToggle) {
    defaultToggle.addEventListener('change', e => {
      if (e.target.checked) {
        resetToDefault();
      } else {
        openConfigModal();
        showToast('เลือกปรับแต่งเงื่อนไขตามต้องการ');
      }
    });
  }

  // Quick Reset buttons
  document.getElementById('btn-quick-reset').addEventListener('click', resetToDefault);
  document.getElementById('btn-reset-defaults').addEventListener('click', resetToDefault);

  // Meat Category filter buttons
  document.querySelectorAll('#protein-cat-tabs .cat-chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#protein-cat-tabs .cat-chip-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeProteinCat = btn.dataset.cat;

      // Toggle visibility of cut groups
      document.querySelectorAll('.cuts-category-group').forEach(group => {
        const match = activeProteinCat === 'all' || group.dataset.cat === activeProteinCat;
        group.style.display = match ? 'block' : 'none';
      });
    });
  });

  // Select All Cuts Button
  document.getElementById('btn-select-all-cuts').addEventListener('click', () => {
    document.querySelectorAll('[name=specific-cut]').forEach(cb => cb.checked = true);
    autoSaveSettings();
    showToast('เลือกทุกวัตถุดิบและชิ้นส่วนแล้ว');
  });

  // Clear specific cuts filter button
  document.getElementById('btn-clear-cuts').addEventListener('click', () => {
    document.querySelectorAll('[name=specific-cut]').forEach(cb => cb.checked = false);
    autoSaveSettings();
    showToast('ล้างการเลือกชิ้นส่วน (สุ่มได้ทุกวัตถุดิบ)');
  });

  // Quick Select All buttons for Cuisine & Region chips
  document.querySelectorAll('.quick-select-all').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      const cbs = document.querySelectorAll(`[name=${target}]`);
      const allChecked = [...cbs].every(cb => cb.checked);
      cbs.forEach(cb => cb.checked = !allChecked);
      const isThaiRegion = target === 'thai-region';
      btn.textContent = allChecked
        ? (isThaiRegion ? 'เลือกทุกภาค' : 'เลือกทั้งหมด')
        : (isThaiRegion ? 'ยกเลิกทุกภาค' : 'ยกเลิกทั้งหมด');

      if (target === 'cuisine') {
        syncThaiCuisineAndRegions('cuisine');
      } else if (target === 'thai-region') {
        syncThaiCuisineAndRegions('region');
      }

      autoSaveSettings();
    });
  });

  // Thai Cuisine and Region synchronization
  const thaiCuisineCb = document.getElementById('chk-cuisine-thai') || document.querySelector('[name=cuisine][value="ไทย"]');
  if (thaiCuisineCb) {
    thaiCuisineCb.addEventListener('change', () => {
      syncThaiCuisineAndRegions('cuisine');
      autoSaveSettings();
    });
  }

  document.querySelectorAll('[name=thai-region]').forEach(cb => {
    cb.addEventListener('change', () => {
      syncThaiCuisineAndRegions('region');
      autoSaveSettings();
    });
  });

  // Hero Random Button
  document.getElementById('btn-random-hero').addEventListener('click', executeRandomRoll);

  // ─── Config Modal Listeners ───
  const btnConfigHeader = document.getElementById('btn-open-config-header');
  if (btnConfigHeader) btnConfigHeader.addEventListener('click', openConfigModal);

  const btnConfigHero = document.getElementById('btn-open-config-hero');
  if (btnConfigHero) btnConfigHero.addEventListener('click', openConfigModal);

  const btnCloseConfig = document.getElementById('btn-close-config');
  if (btnCloseConfig) btnCloseConfig.addEventListener('click', closeConfigModal);

  const btnConfigSaveClose = document.getElementById('btn-config-save-close');
  if (btnConfigSaveClose) {
    btnConfigSaveClose.addEventListener('click', () => {
      closeConfigModal();
      showToast('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    });
  }

  const btnConfigSaveRoll = document.getElementById('btn-config-save-roll');
  if (btnConfigSaveRoll) {
    btnConfigSaveRoll.addEventListener('click', () => {
      closeConfigModal();
      executeRandomRoll();
    });
  }

  const btnResetModal = document.getElementById('btn-reset-modal');
  if (btnResetModal) btnResetModal.addEventListener('click', resetToDefault);

  const configModal = document.getElementById('config-modal');
  if (configModal) {
    configModal.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeConfigModal();
    });
  }

  // Soup checkboxes sync with dish type pills
  const morningSoupCb = document.getElementById('morning-pair-soup');
  if (morningSoupCb) {
    morningSoupCb.addEventListener('change', () => {
      const soupChip = document.querySelector('[name=morning-types][value="ต้ม/แกง"]');
      if (soupChip && morningSoupCb.checked) {
        soupChip.checked = true;
      }
      autoSaveSettings();
    });
  }

  const eveningSoupCb = document.getElementById('evening-pair-soup');
  if (eveningSoupCb) {
    eveningSoupCb.addEventListener('change', () => {
      const soupChip = document.querySelector('[name=evening-types][value="ต้ม/แกง"]');
      if (soupChip && eveningSoupCb.checked) {
        soupChip.checked = true;
      }
      autoSaveSettings();
    });
  }

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
      showToast('ล้างประวัติทั้งหมดแล้ว');
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

  const newCuisineSelect = document.getElementById('new-menu-cuisine');
  const regionWrap = document.getElementById('new-menu-region-wrap');
  if (newCuisineSelect && regionWrap) {
    newCuisineSelect.addEventListener('change', () => {
      regionWrap.style.display = newCuisineSelect.value === 'ไทย' ? '' : 'none';
    });
  }

  // Global ESC key listener to close modals
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      hideCutContextMenu();
      closeConfigModal();
      closeHistoryModal();
      closeCatalogModal();
    }
  });

  // Context Menu Actions for Protein Chips
  const ctxSearchBtn = document.getElementById('ctx-action-search');
  if (ctxSearchBtn) {
    ctxSearchBtn.addEventListener('click', () => {
      if (!currentContextCut) return;
      const { cutId, cutLabel } = currentContextCut;
      hideCutContextMenu();
      closeConfigModal();
      document.querySelectorAll('#catalog-tabs .cat-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.filter === 'all');
      });
      activeCatalogFilter = 'all';
      openCatalogModal(cutId);
      showToast(`ค้นหาเมนูวัตถุดิบ "${cutLabel}" ในคลังอาหาร`);
    });
  }

  const ctxSelectOnlyBtn = document.getElementById('ctx-action-select-only');
  if (ctxSelectOnlyBtn) {
    ctxSelectOnlyBtn.addEventListener('click', () => {
      if (!currentContextCut) return;
      const { cutId, cutLabel } = currentContextCut;
      hideCutContextMenu();
      document.querySelectorAll('[name=specific-cut]').forEach(cb => {
        cb.checked = (cb.value === cutId);
      });
      autoSaveSettings();
      showToast(`เลือกเฉพาะ "${cutLabel}" สำหรับการสุ่มแล้ว`);
    });
  }

  // Dismiss context menu on click outside or scroll
  document.addEventListener('click', e => {
    if (!e.target.closest('#cut-context-menu')) {
      hideCutContextMenu();
    }
  });

  window.addEventListener('scroll', hideCutContextMenu, true);
}

document.addEventListener('DOMContentLoaded', boot);
