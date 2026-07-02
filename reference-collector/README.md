# คลังเรฟเฟอเรนซ์ (Reference Collector)

เว็บแอพเก็บลิงก์เรฟเฟอเรนซ์ วางลิงก์แล้วระบบจัดหมวดให้อัตโนมัติ
ข้อมูลเก็บไว้ใน `localStorage` ของเบราว์เซอร์ (เก็บเฉพาะเครื่อง/เบราว์เซอร์ที่ใช้เปิด)

## รันบนเครื่องตัวเอง (ทดสอบก่อน deploy)

ต้องมี [Node.js](https://nodejs.org) ติดตั้งไว้ก่อน (เวอร์ชัน 18 ขึ้นไป)

```bash
npm install
npm run dev
```

จะเปิดที่ `http://localhost:5173`

## Deploy ขึ้นเว็บจริง — วิธีที่ง่ายที่สุด: Vercel

1. สร้างบัญชีฟรีที่ [vercel.com](https://vercel.com) (login ด้วย GitHub ได้เลย)
2. อัปโหลดโฟลเดอร์นี้ขึ้น GitHub repo ใหม่ (หรือใช้ [Vercel CLI](https://vercel.com/docs/cli) ก็ได้ ไม่ต้องผ่าน GitHub)
3. ใน Vercel กด **Add New Project** → เลือก repo นี้
4. Framework Preset จะขึ้น **Vite** ให้อัตโนมัติ — กด **Deploy** ได้เลย ไม่ต้องตั้งค่าอะไรเพิ่ม
5. รอสักครู่ จะได้ลิงก์ เช่น `https://your-project.vercel.app`

### หรือใช้ Vercel CLI (ไม่ต้องใช้ GitHub)

```bash
npm install -g vercel
vercel
```

ตอบคำถามตามที่ CLI ถาม (โปรเจกต์ใหม่, ใช้ค่า default ได้เลย) แล้วจะได้ลิงก์ทันที

## Deploy ทางเลือกอื่น: Netlify

1. สมัครที่ [netlify.com](https://netlify.com)
2. ลาก-วางโฟลเดอร์ `dist` (หลังรัน `npm run build`) เข้าหน้า Netlify Drop ได้เลย: [app.netlify.com/drop](https://app.netlify.com/drop)
3. หรือเชื่อมกับ GitHub repo แบบเดียวกับ Vercel — Build command: `npm run build`, Publish directory: `dist`

## ข้อจำกัดที่ควรรู้

- ข้อมูลอยู่ใน `localStorage` ของเบราว์เซอร์เครื่องนั้นๆ **ถ้าเปิดจากมือถือกับคอมจะเห็นข้อมูลคนละชุดกัน** และถ้าล้าง cache/เปลี่ยนเบราว์เซอร์ข้อมูลจะหาย
- ถ้าอยากให้ข้อมูลซิงค์ข้ามอุปกรณ์ได้ ต้องต่อฐานข้อมูลจริง (เช่น Supabase หรือ Firebase) — บอกได้ถ้าอยากให้ช่วยต่อให้

## แก้ไข/ปรับแต่ง

โค้ดหลักอยู่ที่ `src/App.jsx` ไฟล์เดียว ปรับสี, ฟอนต์, หรือกฎการจัดหมวดหมู่ (ตัวแปร `KNOWN_SITES` และ `KEYWORD_RULES`) ได้ตรงนั้นเลย
