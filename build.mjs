// Builds index.html (the website Vercel serves) from app.html (the same page used for the claude.ai artifact).
// app.html has no <html>/<head> wrapper because claude.ai adds one; the website needs its own.
// Run: node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const app = readFileSync(new URL('./app.html', import.meta.url), 'utf8');
const html = `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="คู่มืออาหารสำหรับคนเป็นกรดไหลย้อน ดูว่าอะไรกินได้ อะไรควรเลี่ยง และถ่ายรูปอาหารให้ AI ช่วยดู">
<meta name="theme-color" content="#1d5a52">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%231d5a52'/%3E%3Cpath d='M12 5v6M9 8l3 3 3-3M7 14c0 3 2 5 5 5s5-2 5-5' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${app}
</body>
</html>
`;
writeFileSync(new URL('./index.html', import.meta.url), html);
console.log('index.html built');
