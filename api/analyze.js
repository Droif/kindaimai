// Vercel serverless function: assesses a food photo or dish name for acid-reflux (GERD) safety with Gemini.
// Needs env var GEMINI_API_KEY (free key from https://aistudio.google.com/apikey). Optional GEMINI_MODEL.
// The prompt is fixed here so the endpoint can't be used as a general-purpose AI proxy.

const MAX_IMAGE_B64 = 3_000_000; // ~2.2 MB image; the page shrinks photos to ~1024px first
const MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

function buildPrompt(subject, names) {
  return `คุณเป็นนักโภชนาการที่ช่วยผู้ป่วยโรคกรดไหลย้อน (GERD) ${subject}
ประเมินว่าเหมาะกับคนเป็นกรดไหลย้อนแค่ไหน โดยดูจากปัจจัยกระตุ้นที่รู้กัน: ไขมันสูง ของทอด กะทิ ความเปรี้ยว/กรด (มะนาว มะเขือเทศ ส้ม น้ำส้มสายชู) ความเผ็ด (พริก) กระเทียม/หอมดิบ คาเฟอีน ช็อกโกแลต มินต์ แอลกอฮอล์ น้ำอัดลม และปริมาณที่มากเกินไป
ตอบเป็นภาษาไทย เป็น JSON อย่างเดียวตามรูปแบบนี้:
{"isFood":true,"dish":"ชื่ออาหาร","confidence":"high|medium|low","verdict":"ok|limit|avoid","summary":"สรุป 1-2 ประโยค","ingredients":[{"name":"วัตถุดิบ","status":"ok|limit|avoid","note":"สั้น ๆ"}],"tips":["วิธีกินหรือสั่งให้ปลอดภัยขึ้น"],"alternatives":["เมนูทดแทนที่ปลอดภัยกว่า"],"matches":["ชื่อจากรายการอ้างอิงที่ตรงหรือใกล้เคียง"]}
ok = กินได้, limit = กินได้บ้างแต่ควรระวังปริมาณ, avoid = ควรเลี่ยง. ingredients 3-7 รายการ, tips 2-4 ข้อ, alternatives 0-3 ข้อ, matches 0-4 ชื่อ โดยเลือกเฉพาะชื่อจากรายการอ้างอิงนี้: ${names}
ถ้าไม่ใช่อาหารหรือเครื่องดื่ม ให้ตอบ {"isFood":false}`;
}

function parseLoose(text) {
  try { return JSON.parse(text); } catch (e) {}
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(text.slice(a, b + 1)); } catch (e) {} }
  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: 'no_key' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body || '{}'); } catch (e) { body = null; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'bad_request' });

  const names = String(body.names || '').slice(0, 6000);
  const parts = [];
  if (body.kind === 'photo') {
    const image = String(body.image || '');
    const mime = MIMES.includes(body.mime) ? body.mime : 'image/jpeg';
    if (!image) return res.status(400).json({ error: 'bad_request' });
    if (image.length > MAX_IMAGE_B64) return res.status(413).json({ error: 'too_large' });
    parts.push({ text: buildPrompt('ดูรูปอาหารที่แนบมา ระบุว่าเป็นเมนูอะไร (ส่วนใหญ่เป็นอาหารไทย) และวัตถุดิบที่มองเห็นหรือน่าจะมี', names) });
    parts.push({ inline_data: { mime_type: mime, data: image } });
  } else if (body.kind === 'text') {
    const name = String(body.name || '').replace(/["\n\r]/g, ' ').trim().slice(0, 120);
    if (!name) return res.status(400).json({ error: 'bad_request' });
    parts.push({ text: buildPrompt(`ประเมินอาหารหรือเครื่องดื่มชื่อ: "${name}" ใส่วัตถุดิบหลักตามสูตรที่พบทั่วไป`, names) });
  } else {
    return res.status(400).json({ error: 'bad_request' });
  }

  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
      }),
    });
    if (r.status === 429) return res.status(429).json({ error: 'rate_limited' });
    if (!r.ok) {
      console.error('gemini error', r.status, (await r.text()).slice(0, 500));
      return res.status(502).json({ error: 'upstream' });
    }
    const j = await r.json();
    const text = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
    const out = parseLoose(text);
    if (!out || typeof out !== 'object') return res.status(502).json({ error: 'invalid_json' });
    return res.status(200).json(out);
  } catch (e) {
    console.error('analyze failed', e);
    return res.status(502).json({ error: 'upstream' });
  }
};
