# 🍽️ สุ่มเมนูอาหาร

เว็บ app สุ่มเมนูอาหารมื้อเช้า-เย็น ทำจาก Vanilla HTML/JS/CSS ล้วน  
Deploy บน [GitHub Pages](https://pages.github.com/) ฟรี — ไม่มี server, ไม่มี database

## ✨ Features

- **สุ่มเมนูเช้า + เย็น** พร้อมกันในคลิกเดียว
- **Default เช้า** = กับข้าว ไม่เผ็ด x2 (ติ้กเพิ่มจานเดียวได้)
- **Default เย็น** = ทุกประเภท มีเผ็ดได้ x2
- **ไม่ซ้ำ 30 วัน** (เก็บ history ใน localStorage, purge อัตโนมัติ)
- **📋 ประวัติ** popup แสดงเมนูที่สุ่มผ่านมา
- **⚙️ Config** กรอง protein, สัญชาติ, จำนวน
- **~189 เมนู** ครอบคลุม ไทย จีน ญี่ปุ่น ฝรั่ง

## 🚀 Deploy บน GitHub Pages

```bash
git init
git add .
git commit -m "🍽️ init random menu app"
git remote add origin https://github.com/<username>/random-menu.git
git push -u origin main
```

จากนั้น Settings → Pages → Source: `main` branch → Save  
เว็บจะออนไลน์ที่ `https://<username>.github.io/random-menu/`

## 🛠️ Run locally

```bash
cd RANDOM_MENU
python3 -m http.server 8787
# เปิด http://localhost:8787
```

## 📁 Structure

```
RANDOM_MENU/
├── index.html      ← single page app
├── data/
│   └── menus.js    ← dataset ~189 เมนู (ES module)
├── js/
│   ├── app.js      ← filter + random logic + UI
│   └── storage.js  ← localStorage wrapper (settings + history)
└── css/
    └── style.css   ← mobile-first styling
```

## ➕ เพิ่มเมนูเอง

แก้ไข `data/menus.js` เพิ่ม object เข้าไปใน array `MENUS`:

```js
{ 
  id: "th_999",             // unique id
  name: "เมนูใหม่",         // ชื่อเมนู
  cuisine: "ไทย",           // "ไทย" | "จีน" | "ญี่ปุ่น" | "ฝรั่ง"
  dish_type: "กับข้าว",     // "กับข้าว" | "ต้ม/แกง" | "จานเดียว"
  proteins: ["หมูสับ"],     // วัตถุดิบหลัก
  protein_groups: ["หมู"],  // กลุ่มวัตถุดิบ (ใช้ filter)
  spicy: false,             // เผ็ดหรือไม่
  is_pair: false,           // เป็น side dish คู่กับข้าวหรือไม่
},
```
