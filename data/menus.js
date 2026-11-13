// menus.js — Random Menu Dataset with Base Dish & Protein Add-ons
// ข้อมูลเมนูอาหารระดับ Base Dish พร้อมระบบ Add-ons เนื้อสัตว์ที่ปรับเปลี่ยนได้ยืดหยุ่น

export const THAI_REGIONS = [
  { id: "กลาง", label: "ภาคกลาง" },
  { id: "อีสาน", label: "ภาคอีสาน" },
  { id: "เหนือ", label: "ภาคเหนือ" },
  { id: "ใต้", label: "ภาคใต้" },
];

export const PROTEIN_CATEGORIES = {
  หมู: {
    label: "เนื้อหมู",
    cuts: [
      { id: "หมูกรอบ", label: "หมูกรอบ" },
      { id: "หมูสับ", label: "หมูสับ" },
      { id: "หมูชิ้น", label: "หมูชิ้น" },
      { id: "หมูสไลด์", label: "หมูสไลด์" },
      { id: "หมูสามชั้น", label: "หมูสามชั้น" },
    ]
  },
  ไก่: {
    label: "เนื้อไก่",
    cuts: [
      { id: "อกไก่", label: "อกไก่" },
      { id: "ไก่สับ", label: "ไก่สับ" },
      { id: "ไก่", label: "ไก่ชิ้น / น่อง / ปีก" },
    ]
  },
  เนื้อ: {
    label: "เนื้อวัว",
    cuts: [
      { id: "เนื้อสับ", label: "เนื้อสับ" },
      { id: "เนื้อสไลด์", label: "เนื้อสไลด์" },
      { id: "เนื้อ", label: "เนื้อวัวชิ้น" },
    ]
  },
  ทะเล: {
    label: "อาหารทะเล",
    cuts: [
      { id: "กุ้ง", label: "กุ้ง" },
      { id: "หมึก", label: "ปลาหมึก" },
      { id: "ปลา", label: "ปลา (นิล/กระพง/ทู/สลิด)" },
      { id: "หอย", label: "หอย" },
      { id: "ปู", label: "เนื้อปู" },
      { id: "ทะเล", label: "รวมมิตรทะเล" },
    ]
  },
  เป็ด: {
    label: "เป็ด",
    cuts: [
      { id: "เป็ด", label: "เนื้อเป็ด / เป็ดย่าง" }
    ]
  },
  ไข่: {
    label: "ไข่",
    cuts: [
      { id: "ไข่", label: "เมนูไข่" }
    ]
  },
  ผัก: {
    label: "มังสวิรัติ / เต้าหู้",
    cuts: [
      { id: "ผัก", label: "ผักล้วน / เต้าหู้ / เห็ด" }
    ]
  }
};

export const PROTEIN_CUT_META = {
  หมูสับ:    { group: 'หมู', label: 'หมูสับ' },
  หมูชิ้น:   { group: 'หมู', label: 'หมูชิ้น' },
  หมูกรอบ:   { group: 'หมู', label: 'หมูกรอบ' },
  หมูสไลด์:  { group: 'หมู', label: 'หมูสไลด์' },
  หมูสามชั้น:{ group: 'หมู', label: 'หมูสามชั้น' },
  อกไก่:     { group: 'ไก่', label: 'อกไก่' },
  ไก่สับ:    { group: 'ไก่', label: 'ไก่สับ' },
  ไก่:       { group: 'ไก่', label: 'ไก่' },
  เนื้อสับ:   { group: 'เนื้อ', label: 'เนื้อสับ' },
  เนื้อสไลด์:{ group: 'เนื้อ', label: 'เนื้อสไลด์' },
  เนื้อ:     { group: 'เนื้อ', label: 'เนื้อวัว' },
  กุ้ง:      { group: 'ทะเล', label: 'กุ้ง' },
  หมึก:      { group: 'ทะเล', label: 'หมึก' },
  ปลา:       { group: 'ทะเล', label: 'ปลา' },
  หอย:       { group: 'ทะเล', label: 'หอย' },
  ปู:        { group: 'ทะเล', label: 'ปู' },
  ทะเล:      { group: 'ทะเล', label: 'ทะเล' },
  เป็ด:      { group: 'เป็ด', label: 'เป็ด' },
  ไข่:       { group: 'ไข่', label: 'ไข่' },
  ผัก:       { group: 'ผัก', label: 'ผัก' },
};

export const PROTEIN_GROUPS = {
  หมู:   ["หมูสับ", "หมูชิ้น", "หมูสไลด์", "หมูสามชั้น", "หมูกรอบ"],
  ไก่:   ["ไก่", "อกไก่", "ไก่สับ"],
  เนื้อ: ["เนื้อสับ", "เนื้อสไลด์", "เนื้อ"],
  ทะเล:  ["กุ้ง", "หมึก", "ปู", "ปลา", "หอย", "ทะเล"],
  ไข่:   ["ไข่"],
  เป็ด:  ["เป็ด"],
  ผัก:   ["ผัก"],
};

export function formatDishName(template, baseName, protein) {
  if (!protein || protein === 'ผัก') {
    if (template.includes('{protein}')) {
      return template.replace('{protein}', protein === 'ผัก' ? 'ผักรวม' : '').replace(/\s+/g, ' ').trim();
    }
    return baseName;
  }
  if (template.includes('{protein}')) {
    return template.replace('{protein}', protein);
  }
  return `${baseName} (${protein})`;
}

export function resolveDish(baseDish, protein) {
  const chosenProtein = protein || (baseDish.allowed_proteins && baseDish.allowed_proteins[0]) || 'ผัก';
  const name = formatDishName(baseDish.name_template || baseDish.base_name, baseDish.base_name, chosenProtein);
  const meta = PROTEIN_CUT_META[chosenProtein] || { group: 'ผัก', label: chosenProtein };

  return {
    id: `${baseDish.id}_${chosenProtein}`,
    baseId: baseDish.id,
    baseName: baseDish.base_name,
    nameTemplate: baseDish.name_template || baseDish.base_name,
    selectedProtein: chosenProtein,
    name: name,
    cuisine: baseDish.cuisine,
    region: baseDish.region || null,
    dish_type: baseDish.dish_type,
    spicy: Boolean(baseDish.spicy),
    is_pair: Boolean(baseDish.is_pair),
    allowed_proteins: [...(baseDish.allowed_proteins || [chosenProtein])],
    proteins: [chosenProtein],
    protein_groups: [meta.group],
    is_custom: Boolean(baseDish.is_custom),
  };
}

export const BASE_MENUS = [
  {
    "id": "th_c_kaprao",
    "base_name": "กะเพรา",
    "name_template": "กะเพรา{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ",
      "หมูกรอบ",
      "หมูชิ้น",
      "หมูสไลด์",
      "ไก่สับ",
      "อกไก่",
      "เนื้อสับ",
      "เนื้อสไลด์",
      "กุ้ง",
      "หมึก",
      "ทะเล"
    ]
  },
  {
    "id": "th_c_prik_gaeng",
    "base_name": "ผัดพริกแกง",
    "name_template": "ผัดพริกแกง{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูกรอบ",
      "หมูชิ้น",
      "หมูสามชั้น",
      "ไก่",
      "เนื้อ",
      "กุ้ง"
    ]
  },
  {
    "id": "th_c_prik_gaeng_tua",
    "base_name": "ผัดพริกแกงถั่วฝักยาว",
    "name_template": "ผัดพริกแกง{protein}ใส่ถั่วฝักยาว",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น",
      "หมูกรอบ",
      "หมูสามชั้น",
      "ไก่"
    ]
  },
  {
    "id": "th_c_prik_pao",
    "base_name": "ผัดพริกเผา",
    "name_template": "ผัดพริกเผา{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น",
      "หมูกรอบ",
      "ไก่",
      "กุ้ง",
      "หมึก",
      "หอย",
      "ทะเล"
    ]
  },
  {
    "id": "th_c_khing",
    "base_name": "ผัดขิง",
    "name_template": "ผัดขิง{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "ไก่",
      "หมูชิ้น",
      "หมูสับ",
      "ปลา"
    ]
  },
  {
    "id": "th_c_prik_kluea",
    "base_name": "ผัดพริกเกลือ",
    "name_template": "ผัดพริกเกลือ{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูกรอบ",
      "ไก่",
      "กุ้ง",
      "หมึก",
      "ปลา"
    ]
  },
  {
    "id": "th_c_kratiam",
    "base_name": "ทอดกระเทียมพริกไทย",
    "name_template": "{protein}ทอดกระเทียมพริกไทย",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น",
      "หมูสับ",
      "หมูกรอบ",
      "ไก่",
      "กุ้ง",
      "หมึก"
    ]
  },
  {
    "id": "th_c_namman_hoy",
    "base_name": "ผัดน้ำมันหอย",
    "name_template": "ผัด{protein}น้ำมันหอย",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น",
      "อกไก่",
      "เนื้อสไลด์",
      "หมูกรอบ"
    ]
  },
  {
    "id": "th_c_kana",
    "base_name": "ผัดคะน้า",
    "name_template": "ผัดคะน้า{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูกรอบ",
      "หมูชิ้น",
      "ไก่",
      "หมูสับ"
    ]
  },
  {
    "id": "th_c_kalampri",
    "base_name": "ผัดกะหล่ำปลี",
    "name_template": "ผัดกะหล่ำปลี{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูกรอบ",
      "หมูชิ้น",
      "หมูสามชั้น",
      "กุ้ง",
      "ผัก"
    ]
  },
  {
    "id": "th_c_pakbung",
    "base_name": "ผัดผักบุ้ง",
    "name_template": "ผัดผักบุ้ง{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูกรอบ",
      "หมูสับ",
      "ผัก"
    ]
  },
  {
    "id": "th_c_broccoli",
    "base_name": "ผัดบล็อกโคลี่",
    "name_template": "ผัดบล็อกโคลี่{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "กุ้ง",
      "อกไก่",
      "หมูชิ้น",
      "หมูกรอบ"
    ]
  },
  {
    "id": "th_c_pong_karee",
    "base_name": "ผัดผงกะหรี่",
    "name_template": "ผัดผงกะหรี่{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "กุ้ง",
      "ปู",
      "หมึก",
      "ทะเล",
      "ไก่",
      "หมูชิ้น"
    ]
  },
  {
    "id": "th_c_pad_cha",
    "base_name": "ผัดฉ่า",
    "name_template": "ผัดฉ่า{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "ปลา",
      "ทะเล",
      "หมึก",
      "กุ้ง"
    ]
  },
  {
    "id": "th_c_priew_wan",
    "base_name": "ผัดเปรี้ยวหวาน",
    "name_template": "ผัดเปรี้ยวหวาน{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น",
      "ไก่",
      "กุ้ง",
      "ปลา"
    ]
  },
  {
    "id": "th_c_khai_jeaw",
    "base_name": "ไข่เจียว",
    "name_template": "ไข่เจียว{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ",
      "กุ้ง",
      "ปู",
      "ไข่"
    ]
  },
  {
    "id": "th_c_pad_dokkalam",
    "base_name": "ผัดดอกกะหล่ำ",
    "name_template": "ผัดดอกกะหล่ำ{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น",
      "กุ้ง",
      "หมูสับ",
      "ไก่"
    ]
  },
  {
    "id": "th_c_pad_khajorn",
    "base_name": "ผัดดอกขจรใส่ไข่",
    "name_template": "ผัดดอกขจรใส่ไข่{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ",
      "กุ้ง",
      "ไข่"
    ]
  },
  {
    "id": "th_c_pad_faktong",
    "base_name": "ผัดฟักทองใส่ไข่",
    "name_template": "ผัดฟักทองใส่ไข่{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ",
      "ไข่"
    ]
  },
  {
    "id": "th_c_pad_taohu",
    "base_name": "ผัดถั่วงอกเต้าหู้",
    "name_template": "ผัดถั่วงอกเต้าหู้{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ",
      "หมูกรอบ",
      "ผัก"
    ]
  },
  {
    "id": "th_c_pad_taeng",
    "base_name": "ผัดแตงกวาใส่ไข่",
    "name_template": "ผัดแตงกวาใส่ไข่{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ",
      "ไก่",
      "ไข่"
    ]
  },
  {
    "id": "th_c_pad_buab",
    "base_name": "ผัดบวบใส่ไข่",
    "name_template": "ผัดบวบใส่ไข่{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ",
      "กุ้ง",
      "ไข่"
    ]
  },
  {
    "id": "th_c_tod_nampla",
    "base_name": "ทอดน้ำปลา",
    "name_template": "{protein}ทอดน้ำปลา",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูกรอบ",
      "หมูสามชั้น",
      "ปลา",
      "ไก่"
    ]
  },
  {
    "id": "th_c_plakapong_tod",
    "base_name": "ปลากะพงทอดน้ำปลา",
    "name_template": "ปลากะพงทอดน้ำปลา",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "ปลา"
    ]
  },
  {
    "id": "th_c_hor_mok",
    "base_name": "ห่อหมก",
    "name_template": "ห่อหมก{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "ปลา",
      "ทะเล",
      "ปู"
    ]
  },
  {
    "id": "th_c_kai_palow",
    "base_name": "ไข่พะโล้",
    "name_template": "ไข่พะโล้{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสามชั้น",
      "หมูชิ้น",
      "ไก่",
      "ไข่"
    ]
  },
  {
    "id": "th_c_panaeng",
    "base_name": "พะแนง",
    "name_template": "พะแนง{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น",
      "ไก่",
      "เนื้อสไลด์"
    ]
  },
  {
    "id": "th_c_moo_waan",
    "base_name": "หมูหวาน",
    "name_template": "หมูหวาน",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสามชั้น",
      "หมูชิ้น"
    ]
  },
  {
    "id": "th_c_khai_toon",
    "base_name": "ไข่ตุ๋นทรงเครื่อง",
    "name_template": "ไข่ตุ๋น{protein}ทรงเครื่อง",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ",
      "กุ้ง",
      "ไข่"
    ]
  },
  {
    "id": "th_c_pad_cha_om",
    "base_name": "ผัดวุ้นเส้นชะอมไข่",
    "name_template": "ผัดวุ้นเส้นชะอมไข่{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "กุ้ง",
      "หมูสับ",
      "ไข่"
    ]
  },
  {
    "id": "th_c_tomyum_namkon",
    "base_name": "ต้มยำน้ำข้น",
    "name_template": "ต้มยำ{protein}น้ำข้น",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "ต้ม/แกง",
    "spicy": true,
    "is_pair": true,
    "allowed_proteins": [
      "กุ้ง",
      "ทะเล",
      "ปลา",
      "ไก่",
      "หมึก"
    ]
  },
  {
    "id": "th_c_tomyum_namsai",
    "base_name": "ต้มยำน้ำใส",
    "name_template": "ต้มยำ{protein}น้ำใส",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "ต้ม/แกง",
    "spicy": true,
    "is_pair": true,
    "allowed_proteins": [
      "ปลา",
      "ทะเล",
      "ไก่",
      "กุ้ง"
    ]
  },
  {
    "id": "th_c_tomkha",
    "base_name": "ต้มข่า",
    "name_template": "ต้มข่า{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "ต้ม/แกง",
    "spicy": false,
    "is_pair": true,
    "allowed_proteins": [
      "ไก่",
      "หมูชิ้น",
      "ทะเล",
      "ผัก"
    ]
  },
  {
    "id": "th_c_tomjued_taohu",
    "base_name": "ต้มจืดเต้าหู้สาหร่าย",
    "name_template": "ต้มจืดเต้าหู้สาหร่าย{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "ต้ม/แกง",
    "spicy": false,
    "is_pair": true,
    "allowed_proteins": [
      "หมูสับ",
      "ไก่สับ"
    ]
  },
  {
    "id": "th_c_tomjued_tamlung",
    "base_name": "ต้มจืดตำลึง",
    "name_template": "ต้มจืดตำลึง{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "ต้ม/แกง",
    "spicy": false,
    "is_pair": true,
    "allowed_proteins": [
      "หมูสับ",
      "ไก่สับ"
    ]
  },
  {
    "id": "th_c_tomjued_mara",
    "base_name": "ต้มจืดมะระยัดไส้",
    "name_template": "ต้มจืดมะระยัดไส้{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "ต้ม/แกง",
    "spicy": false,
    "is_pair": true,
    "allowed_proteins": [
      "หมูสับ"
    ]
  },
  {
    "id": "th_c_tomjued_faktong",
    "base_name": "ต้มจืดฟักซี่โครง",
    "name_template": "ต้มจืดฟัก{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "ต้ม/แกง",
    "spicy": false,
    "is_pair": true,
    "allowed_proteins": [
      "หมูชิ้น",
      "ไก่",
      "หมูสับ"
    ]
  },
  {
    "id": "th_c_gaengsom_chaom",
    "base_name": "แกงส้มชะอมไข่",
    "name_template": "แกงส้มชะอมไข่{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "ต้ม/แกง",
    "spicy": true,
    "is_pair": true,
    "allowed_proteins": [
      "กุ้ง",
      "ปลา",
      "ทะเล"
    ]
  },
  {
    "id": "th_c_gaeng_khiew_wan",
    "base_name": "แกงเขียวหวาน",
    "name_template": "แกงเขียวหวาน{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "ต้ม/แกง",
    "spicy": true,
    "is_pair": true,
    "allowed_proteins": [
      "ไก่",
      "หมูชิ้น",
      "เนื้อสไลด์",
      "ปลา"
    ]
  },
  {
    "id": "th_c_gaeng_ped",
    "base_name": "แกงเผ็ด",
    "name_template": "แกงเผ็ด{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "ต้ม/แกง",
    "spicy": true,
    "is_pair": true,
    "allowed_proteins": [
      "เป็ด",
      "หมูชิ้น",
      "ไก่",
      "เนื้อ"
    ]
  },
  {
    "id": "th_c_gaeng_pachee",
    "base_name": "แกงเทโพ",
    "name_template": "แกงเทโพ{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "ต้ม/แกง",
    "spicy": true,
    "is_pair": true,
    "allowed_proteins": [
      "หมูสามชั้น",
      "ปลา"
    ]
  },
  {
    "id": "th_c_gaeng_liang",
    "base_name": "แกงเลียงกุ้งสดผักรวม",
    "name_template": "แกงเลียง{protein}ผักรวม",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "ต้ม/แกง",
    "spicy": true,
    "is_pair": true,
    "allowed_proteins": [
      "กุ้ง",
      "ผัก"
    ]
  },
  {
    "id": "th_c_gaeng_pa",
    "base_name": "แกงป่า",
    "name_template": "แกงป่า{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "ต้ม/แกง",
    "spicy": true,
    "is_pair": true,
    "allowed_proteins": [
      "หมูชิ้น",
      "ไก่",
      "เนื้อ",
      "ปลา"
    ]
  },
  {
    "id": "th_c_khao_pad",
    "base_name": "ข้าวผัด",
    "name_template": "ข้าวผัด{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น",
      "ไก่",
      "กุ้ง",
      "ปู",
      "หมึก",
      "ทะเล",
      "หมูกรอบ",
      "ไข่"
    ]
  },
  {
    "id": "th_c_pad_see_ew",
    "base_name": "ผัดซีอิ๊ว",
    "name_template": "ผัดซีอิ๊ว{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น",
      "ไก่",
      "หมูกรอบ",
      "ทะเล",
      "เนื้อสไลด์"
    ]
  },
  {
    "id": "th_c_rad_na",
    "base_name": "ราดหน้า",
    "name_template": "ราดหน้า{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น",
      "ไก่",
      "ทะเล",
      "หมูกรอบ",
      "เนื้อสไลด์"
    ]
  },
  {
    "id": "th_c_pad_thai",
    "base_name": "ผัดไทย",
    "name_template": "ผัดไทย{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "กุ้ง",
      "ไก่",
      "ทะเล",
      "หมูกรอบ",
      "ผัก"
    ]
  },
  {
    "id": "th_c_kua_gai",
    "base_name": "ก๋วยเตี๋ยวคั่ว",
    "name_template": "ก๋วยเตี๋ยวคั่ว{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "ไก่",
      "หมูชิ้น",
      "ทะเล",
      "กุ้ง",
      "หมึก"
    ]
  },
  {
    "id": "th_c_khao_man_gai",
    "base_name": "ข้าวมันไก่",
    "name_template": "ข้าวมันไก่",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "ไก่"
    ]
  },
  {
    "id": "th_c_khao_moo_dang",
    "base_name": "ข้าวหมูแดงหมูกรอบ",
    "name_template": "ข้าวหมูแดงหมูกรอบ",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูกรอบ"
    ]
  },
  {
    "id": "th_c_khao_khai_khon",
    "base_name": "ข้าวไข่ข้น",
    "name_template": "ข้าวไข่ข้น{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "กุ้ง",
      "ปู",
      "หมูสับ",
      "ไข่"
    ]
  },
  {
    "id": "th_c_suki_haeng",
    "base_name": "สุกี้แห้ง",
    "name_template": "สุกี้แห้ง{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น",
      "ไก่",
      "ทะเล",
      "เนื้อสไลด์",
      "ผัก"
    ]
  },
  {
    "id": "th_c_suki_nam",
    "base_name": "สุกี้น้ำ",
    "name_template": "สุกี้น้ำ{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น",
      "ไก่",
      "ทะเล",
      "เนื้อสไลด์",
      "ผัก"
    ]
  },
  {
    "id": "th_c_pad_mama",
    "base_name": "มาม่าผัดขี้เมา",
    "name_template": "มาม่าผัดขี้เมา{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "จานเดียว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ",
      "หมูกรอบ",
      "ทะเล",
      "ไก่",
      "หมูชิ้น"
    ]
  },
  {
    "id": "th_c_khao_tom",
    "base_name": "ข้าวต้ม",
    "name_template": "ข้าวต้ม{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ",
      "กุ้ง",
      "ปลา",
      "ไก่"
    ]
  },
  {
    "id": "th_c_khao_pad_tomyum",
    "base_name": "ข้าวผัดต้มยำ",
    "name_template": "ข้าวผัดต้มยำ{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "จานเดียว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "ทะเล",
      "กุ้ง",
      "ไก่",
      "หมูกรอบ"
    ]
  },
  {
    "id": "th_c_pad_mee_krached",
    "base_name": "ผัดหมี่กระเฉด",
    "name_template": "ผัดหมี่กระเฉด{protein}",
    "cuisine": "ไทย",
    "region": "กลาง",
    "dish_type": "จานเดียว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "กุ้ง",
      "หมูกรอบ",
      "หมึก",
      "ทะเล"
    ]
  },
  {
    "id": "th_s_kua_kling",
    "base_name": "คั่วกลิ้ง",
    "name_template": "คั่วกลิ้ง{protein}",
    "cuisine": "ไทย",
    "region": "ใต้",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ",
      "ไก่สับ",
      "เนื้อสับ",
      "เนื้อสไลด์",
      "หมูกรอบ"
    ]
  },
  {
    "id": "th_s_pad_sator",
    "base_name": "ผัดสะตอกะปิ",
    "name_template": "ผัดสะตอกะปิ{protein}",
    "cuisine": "ไทย",
    "region": "ใต้",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "กุ้ง",
      "หมูสามชั้น",
      "หมูกรอบ",
      "หมูสับ"
    ]
  },
  {
    "id": "th_s_bai_liang",
    "base_name": "ใบเหลียงผัดไข่",
    "name_template": "ใบเหลียงผัดไข่{protein}",
    "cuisine": "ไทย",
    "region": "ใต้",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "ไข่",
      "กุ้ง",
      "หมูสับ"
    ]
  },
  {
    "id": "th_s_gaengsom_tai",
    "base_name": "แกงส้มใต้หน่อไม้ดอง",
    "name_template": "แกงส้มใต้{protein}หน่อไม้ดอง",
    "cuisine": "ไทย",
    "region": "ใต้",
    "dish_type": "ต้ม/แกง",
    "spicy": true,
    "is_pair": true,
    "allowed_proteins": [
      "ปลา",
      "กุ้ง",
      "หมูสามชั้น"
    ]
  },
  {
    "id": "th_s_gaengsom_maprao",
    "base_name": "แกงส้มใต้ยอดมะพร้าว",
    "name_template": "แกงส้มใต้{protein}ยอดมะพร้าวอ่อน",
    "cuisine": "ไทย",
    "region": "ใต้",
    "dish_type": "ต้ม/แกง",
    "spicy": true,
    "is_pair": true,
    "allowed_proteins": [
      "ปลา",
      "กุ้ง"
    ]
  },
  {
    "id": "th_s_gaeng_tai_pla",
    "base_name": "แกงไตปลา",
    "name_template": "แกงไตปลา",
    "cuisine": "ไทย",
    "region": "ใต้",
    "dish_type": "ต้ม/แกง",
    "spicy": true,
    "is_pair": true,
    "allowed_proteins": [
      "ปลา"
    ]
  },
  {
    "id": "th_s_tom_som",
    "base_name": "ต้มส้ม",
    "name_template": "ต้มส้ม{protein}",
    "cuisine": "ไทย",
    "region": "ใต้",
    "dish_type": "ต้ม/แกง",
    "spicy": false,
    "is_pair": true,
    "allowed_proteins": [
      "ปลา",
      "ไก่"
    ]
  },
  {
    "id": "th_s_moo_hong",
    "base_name": "หมูฮ้องภูเก็ต",
    "name_template": "หมูฮ้องภูเก็ต",
    "cuisine": "ไทย",
    "region": "ใต้",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสามชั้น"
    ]
  },
  {
    "id": "th_s_pad_prik_tai",
    "base_name": "ผัดเผ็ดพริกแกงใต้",
    "name_template": "ผัดเผ็ดพริกแกงใต้{protein}",
    "cuisine": "ไทย",
    "region": "ใต้",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสามชั้น",
      "หมูกรอบ",
      "ไก่",
      "เนื้อ",
      "ปลา"
    ]
  },
  {
    "id": "th_s_gai_tod_hatyai",
    "base_name": "ไก่ทอดหาดใหญ่",
    "name_template": "ไก่ทอดหาดใหญ่+หอมเจียว",
    "cuisine": "ไทย",
    "region": "ใต้",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "ไก่"
    ]
  },
  {
    "id": "th_s_tom_kamin",
    "base_name": "ต้มขมิ้น",
    "name_template": "ต้มขมิ้น{protein}",
    "cuisine": "ไทย",
    "region": "ใต้",
    "dish_type": "ต้ม/แกง",
    "spicy": false,
    "is_pair": true,
    "allowed_proteins": [
      "ไก่",
      "ปลา"
    ]
  },
  {
    "id": "th_e_larb",
    "base_name": "ลาบ",
    "name_template": "ลาบ{protein}",
    "cuisine": "ไทย",
    "region": "อีสาน",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ",
      "ไก่สับ",
      "เนื้อสับ",
      "เนื้อสไลด์",
      "เป็ด",
      "หมึก",
      "ปลา"
    ]
  },
  {
    "id": "th_e_namtok",
    "base_name": "น้ำตก",
    "name_template": "น้ำตก{protein}",
    "cuisine": "ไทย",
    "region": "อีสาน",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น",
      "หมูสามชั้น",
      "เนื้อสไลด์",
      "ไก่"
    ]
  },
  {
    "id": "th_e_tom_zaab",
    "base_name": "ต้มแซ่บ",
    "name_template": "ต้มแซ่บ{protein}",
    "cuisine": "ไทย",
    "region": "อีสาน",
    "dish_type": "ต้ม/แกง",
    "spicy": true,
    "is_pair": true,
    "allowed_proteins": [
      "หมูชิ้น",
      "หมูสับ",
      "ไก่",
      "เนื้อ"
    ]
  },
  {
    "id": "th_e_gaeng_om",
    "base_name": "แกงอ่อม",
    "name_template": "แกงอ่อม{protein}",
    "cuisine": "ไทย",
    "region": "อีสาน",
    "dish_type": "ต้ม/แกง",
    "spicy": true,
    "is_pair": true,
    "allowed_proteins": [
      "หมูชิ้น",
      "ไก่",
      "เนื้อ",
      "ปลา"
    ]
  },
  {
    "id": "th_e_yang_jaew",
    "base_name": "ย่างน้ำจิ้มแจ่ว",
    "name_template": "{protein}ย่างน้ำจิ้มแจ่ว",
    "cuisine": "ไทย",
    "region": "อีสาน",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น",
      "หมูสามชั้น",
      "ไก่",
      "เนื้อ"
    ]
  },
  {
    "id": "th_e_somtam_thai",
    "base_name": "ส้มตำไทย",
    "name_template": "ส้มตำไทยใส่ไข่เค็ม",
    "cuisine": "ไทย",
    "region": "อีสาน",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "ไข่",
      "กุ้ง"
    ]
  },
  {
    "id": "th_e_somtam_pu",
    "base_name": "ส้มตำปูปลาร้า",
    "name_template": "ส้มตำปูปลาร้า",
    "cuisine": "ไทย",
    "region": "อีสาน",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "ปู"
    ]
  },
  {
    "id": "th_e_tam_sua",
    "base_name": "ตำซั่ว",
    "name_template": "ตำซั่วปูปลาร้า{protein}",
    "cuisine": "ไทย",
    "region": "อีสาน",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูกรอบ"
    ]
  },
  {
    "id": "th_e_soop_nawmai",
    "base_name": "ซุปหน่อไม้",
    "name_template": "ซุปหน่อไม้อีสาน",
    "cuisine": "ไทย",
    "region": "อีสาน",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "ผัก"
    ]
  },
  {
    "id": "th_n_nam_prik_ong",
    "base_name": "น้ำพริกอ่อง",
    "name_template": "น้ำพริกอ่อง{protein}",
    "cuisine": "ไทย",
    "region": "เหนือ",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ",
      "ไก่สับ"
    ]
  },
  {
    "id": "th_n_nam_prik_noom",
    "base_name": "น้ำพริกหนุ่ม",
    "name_template": "น้ำพริกหนุ่ม+ผักต้ม+{protein}",
    "cuisine": "ไทย",
    "region": "เหนือ",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูกรอบ",
      "ไข่"
    ]
  },
  {
    "id": "th_n_hunglay",
    "base_name": "แกงฮังเล",
    "name_template": "แกงฮังเล{protein}",
    "cuisine": "ไทย",
    "region": "เหนือ",
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสามชั้น",
      "หมูชิ้น"
    ]
  },
  {
    "id": "th_n_sai_ua",
    "base_name": "ไส้อั่วสมุนไพรย่าง",
    "name_template": "ไส้อั่วสมุนไพรย่าง",
    "cuisine": "ไทย",
    "region": "เหนือ",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ"
    ]
  },
  {
    "id": "th_n_larb_kua",
    "base_name": "ลาบคั่วเหนือ",
    "name_template": "ลาบคั่วเหนือพริกลาบ{protein}",
    "cuisine": "ไทย",
    "region": "เหนือ",
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ",
      "ไก่สับ",
      "เนื้อสับ",
      "เนื้อสไลด์"
    ]
  },
  {
    "id": "th_n_khao_soi",
    "base_name": "ข้าวซอย",
    "name_template": "ข้าวซอย{protein}",
    "cuisine": "ไทย",
    "region": "เหนือ",
    "dish_type": "จานเดียว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "ไก่",
      "หมูชิ้น",
      "เนื้อสไลด์"
    ]
  },
  {
    "id": "th_n_khanomjeen_namngiaw",
    "base_name": "ขนมจีนน้ำเงี้ยว",
    "name_template": "ขนมจีนน้ำเงี้ยว{protein}",
    "cuisine": "ไทย",
    "region": "เหนือ",
    "dish_type": "จานเดียว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ",
      "หมูชิ้น"
    ]
  },
  {
    "id": "cn_khao_pad_yangchow",
    "base_name": "ข้าวผัดหยางโจว",
    "name_template": "ข้าวผัดหยางโจว{protein}",
    "cuisine": "จีน",
    "region": null,
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "กุ้ง",
      "หมูชิ้น",
      "ไข่"
    ]
  },
  {
    "id": "cn_mee_sua",
    "base_name": "ผัดหมี่ซั่ว",
    "name_template": "ผัดหมี่ซั่ว{protein}",
    "cuisine": "จีน",
    "region": null,
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น",
      "ไก่",
      "กุ้ง",
      "ทะเล",
      "ผัก"
    ]
  },
  {
    "id": "cn_pad_hongkong",
    "base_name": "ผัดผักกาดขาวน้ำมันหอย",
    "name_template": "ผัดผักกาดขาวน้ำมันหอย{protein}",
    "cuisine": "จีน",
    "region": null,
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ",
      "กุ้ง",
      "อกไก่"
    ]
  },
  {
    "id": "cn_mapo_tofu",
    "base_name": "เต้าหู้มาโป",
    "name_template": "เต้าหู้มาโป{protein}ซอสเสฉวน",
    "cuisine": "จีน",
    "region": null,
    "dish_type": "กับข้าว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ",
      "ไก่สับ",
      "เนื้อสับ",
      "เนื้อสไลด์"
    ]
  },
  {
    "id": "cn_gai_pad_met",
    "base_name": "ผัดเม็ดมะม่วงหิมพานต์",
    "name_template": "{protein}ผัดเม็ดมะม่วงหิมพานต์",
    "cuisine": "จีน",
    "region": null,
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "ไก่",
      "กุ้ง",
      "หมูกรอบ"
    ]
  },
  {
    "id": "cn_palow_taohu",
    "base_name": "เต้าหู้พะโล้",
    "name_template": "เต้าหู้พะโล้{protein}ใส่ไข่",
    "cuisine": "จีน",
    "region": null,
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสามชั้น",
      "หมูชิ้น",
      "ไก่",
      "ไข่"
    ]
  },
  {
    "id": "cn_soup_kaowpod",
    "base_name": "ซุปข้าวโพด",
    "name_template": "ซุปข้าวโพด{protein}",
    "cuisine": "จีน",
    "region": null,
    "dish_type": "ต้ม/แกง",
    "spicy": false,
    "is_pair": true,
    "allowed_proteins": [
      "ไก่สับ",
      "ปู",
      "ไข่"
    ]
  },
  {
    "id": "cn_plakapong_neung_see_ew",
    "base_name": "ปลากะพงนึ่งซีอิ๊ว",
    "name_template": "ปลากะพงนึ่งซีอิ๊วสไตล์ฮ่องกง",
    "cuisine": "จีน",
    "region": null,
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "ปลา"
    ]
  },
  {
    "id": "cn_rad_na_hongkong",
    "base_name": "ราดหน้าฮ่องกง",
    "name_template": "ราดหน้าฮ่องกงเส้นกรอบ{protein}",
    "cuisine": "จีน",
    "region": null,
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น",
      "ไก่",
      "ทะเล",
      "เนื้อสไลด์"
    ]
  },
  {
    "id": "jp_donburi",
    "base_name": "ข้าวหน้าดงบุริ",
    "name_template": "ข้าวหน้า{protein}สไตล์ญี่ปุ่น",
    "cuisine": "ญี่ปุ่น",
    "region": null,
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสไลด์",
      "เนื้อสไลด์",
      "ไก่",
      "หมูกรอบ"
    ]
  },
  {
    "id": "jp_curry_rice",
    "base_name": "ข้าวแกงกะหรี่ญี่ปุ่น",
    "name_template": "ข้าวแกงกะหรี่ญี่ปุ่น{protein}",
    "cuisine": "ญี่ปุ่น",
    "region": null,
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น",
      "ไก่",
      "เนื้อสไลด์",
      "กุ้ง"
    ]
  },
  {
    "id": "jp_teriyaki",
    "base_name": "ย่างซีอิ๊วเทอริยากิ",
    "name_template": "{protein}ย่างซีอิ๊วเทอริยากิ",
    "cuisine": "ญี่ปุ่น",
    "region": null,
    "dish_type": "กับข้าว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "ไก่",
      "ปลา",
      "หมูชิ้น"
    ]
  },
  {
    "id": "jp_yaki_soba",
    "base_name": "ยากิโซบะ",
    "name_template": "ยากิโซบะ{protein}",
    "cuisine": "ญี่ปุ่น",
    "region": null,
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสไลด์",
      "ไก่",
      "ทะเล",
      "หมึก"
    ]
  },
  {
    "id": "jp_yaki_udon",
    "base_name": "ยากิอุด้ง",
    "name_template": "ยากิอุด้งผัดซอส{protein}",
    "cuisine": "ญี่ปุ่น",
    "region": null,
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสไลด์",
      "กุ้ง",
      "ไก่",
      "ทะเล"
    ]
  },
  {
    "id": "jp_miso_soup",
    "base_name": "ซุปมิโซะ",
    "name_template": "ซุปมิโซะเต้าหู้สาหร่าย{protein}",
    "cuisine": "ญี่ปุ่น",
    "region": null,
    "dish_type": "ต้ม/แกง",
    "spicy": false,
    "is_pair": true,
    "allowed_proteins": [
      "หมูสไลด์",
      "ปลา",
      "ผัก"
    ]
  },
  {
    "id": "jp_tonkatsu",
    "base_name": "หมูทงคัตสึ",
    "name_template": "หมูทงคัตสึทอดกรอบ",
    "cuisine": "ญี่ปุ่น",
    "region": null,
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น"
    ]
  },
  {
    "id": "jp_ramen_shoyu",
    "base_name": "ราเมนโชยุ",
    "name_template": "ราเมนโชยุ{protein}",
    "cuisine": "ญี่ปุ่น",
    "region": null,
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสามชั้น",
      "หมูสไลด์",
      "ไก่"
    ]
  },
  {
    "id": "int_spaghetti_kee_mao",
    "base_name": "สปาเกตตี้ขี้เมา",
    "name_template": "สปาเกตตี้ขี้เมา{protein}",
    "cuisine": "ฝรั่ง",
    "region": null,
    "dish_type": "จานเดียว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "ทะเล",
      "กุ้ง",
      "หมึก",
      "หมูกรอบ",
      "ไก่",
      "หมูสับ"
    ]
  },
  {
    "id": "int_spaghetti_prik_haeng",
    "base_name": "สปาเกตตี้ผัดพริกแห้ง",
    "name_template": "สปาเกตตี้ผัดพริกแห้ง{protein}",
    "cuisine": "ฝรั่ง",
    "region": null,
    "dish_type": "จานเดียว",
    "spicy": true,
    "is_pair": false,
    "allowed_proteins": [
      "หมูกรอบ",
      "กุ้ง",
      "หอย",
      "หมูชิ้น"
    ]
  },
  {
    "id": "int_spaghetti_carbonara",
    "base_name": "สปาเกตตี้คาโบนาร่า",
    "name_template": "สปาเกตตี้คาโบนาร่า{protein}",
    "cuisine": "ฝรั่ง",
    "region": null,
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น",
      "ไก่",
      "กุ้ง",
      "ไข่"
    ]
  },
  {
    "id": "int_spaghetti_tomato",
    "base_name": "สปาเกตตี้ซอสมะเขือเทศ",
    "name_template": "สปาเกตตี้ซอสมะเขือเทศ{protein}",
    "cuisine": "ฝรั่ง",
    "region": null,
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ",
      "ไก่สับ",
      "เนื้อสับ",
      "เนื้อสไลด์",
      "กุ้ง"
    ]
  },
  {
    "id": "int_steak",
    "base_name": "สเต็กพริกไทยดำ",
    "name_template": "สเต็ก{protein}ซอสพริกไทยดำ",
    "cuisine": "ฝรั่ง",
    "region": null,
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูชิ้น",
      "อกไก่",
      "เนื้อ",
      "ปลา"
    ]
  },
  {
    "id": "int_salad",
    "base_name": "สลัดสุขภาพ",
    "name_template": "สลัด{protein}น้ำสลัดงาญี่ปุ่น",
    "cuisine": "ฝรั่ง",
    "region": null,
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "อกไก่",
      "กุ้ง",
      "ปลา",
      "ไข่"
    ]
  },
  {
    "id": "int_baked_spinach",
    "base_name": "ผักโขมอบชีส",
    "name_template": "ผักโขมอบชีส{protein}",
    "cuisine": "ฝรั่ง",
    "region": null,
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "ไก่",
      "หมูสับ",
      "กุ้ง",
      "ผัก"
    ]
  },
  {
    "id": "int_mushroom_soup",
    "base_name": "ซุปครีมเห็ด",
    "name_template": "ซุปครีมเห็ดข้นเสิร์ฟพร้อมขนมปังกระเทียม",
    "cuisine": "ฝรั่ง",
    "region": null,
    "dish_type": "ต้ม/แกง",
    "spicy": false,
    "is_pair": true,
    "allowed_proteins": [
      "ผัก"
    ]
  },
  {
    "id": "int_macaroni_bake",
    "base_name": "มักกะโรนีอบชีส",
    "name_template": "มักกะโรนีอบชีส{protein}",
    "cuisine": "ฝรั่ง",
    "region": null,
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "หมูสับ",
      "ไก่",
      "กุ้ง"
    ]
  },
  {
    "id": "int_burger",
    "base_name": "เบอร์เกอร์",
    "name_template": "เบอร์เกอร์{protein}ชีสเยิ้ม",
    "cuisine": "ฝรั่ง",
    "region": null,
    "dish_type": "จานเดียว",
    "spicy": false,
    "is_pair": false,
    "allowed_proteins": [
      "เนื้อสับ",
      "เนื้อ",
      "หมูสับ",
      "อกไก่"
    ]
  }
];

export const MENUS = BASE_MENUS.flatMap(base => 
  (base.allowed_proteins && base.allowed_proteins.length ? base.allowed_proteins : ['ผัก'])
    .map(protein => resolveDish(base, protein))
);
