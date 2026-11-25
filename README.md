# กินได้ไหม

คู่มืออาหารสำหรับคนเป็นกรดไหลย้อน: ดูอาหารตามหมวดหมู่ว่ากินได้ กินได้บ้าง หรือควรเลี่ยง และถ่ายรูปอาหารให้ AI ช่วยประเมิน

## ไฟล์
- `app.html` ตัวแอป (แก้ที่ไฟล์นี้) ใช้ได้ทั้งบนเว็บนี้และเป็น artifact ใน claude.ai
- `index.html` สร้างจาก `app.html` ด้วย `node build.mjs` (อย่าแก้ตรง)
- `api/analyze.js` ฟังก์ชันบน Vercel ส่งรูป/ชื่ออาหารให้ Gemini ประเมิน
- `vercel.json` ตั้งค่า static deploy

## Deploy
Vercel ต่อกับ GitHub · push ขึ้น `main` แล้ว deploy อัตโนมัติ

```bash
node build.mjs && git add -A && git commit -m "..." && git push origin main
```

## ตั้งค่า AI
ใน Vercel → Project → Settings → Environment Variables
- `GEMINI_API_KEY` (จำเป็น) สร้างฟรีที่ https://aistudio.google.com/apikey
- `GEMINI_MODEL` (ไม่บังคับ) ค่าเริ่มต้น `gemini-flash-latest`

ตั้งค่าแล้วต้อง Redeploy 1 ครั้ง ถ้าไม่มี key เว็บยังใช้ได้ แต่ฟีเจอร์ถ่ายรูปจะขึ้นข้อความว่ายังไม่ได้ตั้งค่า
