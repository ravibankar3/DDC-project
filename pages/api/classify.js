const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const DDC_MAP_PATH = path.join(process.cwd(), 'data', 'ddc_full.json');
let DDC_MAP = {};
try { DDC_MAP = JSON.parse(fs.readFileSync(DDC_MAP_PATH, 'utf8')); } catch (e) { DDC_MAP = {}; }

function bestLocalMatch(text) {
  text = (text || '').toLowerCase();
  let best = { score: 0 };
  for (const [code, meta] of Object.entries(DDC_MAP)) {
    const label = (meta.label || '').toLowerCase();
    if (!label) continue;
    const labelWords = label.split(/[^a-z0-9]+/).filter(Boolean);
    let score = 0;
    for (const w of labelWords) if (text.includes(w)) score++;
    if (score > best.score) best = { code, label: meta.label, score };
  }
  return best.score > 0 ? best : null;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { text, useOpenAI } = req.body || {};
  if (!text || text.trim().length === 0) return res.status(400).json({ error: 'No text' });

  const local = bestLocalMatch(text);
  if (local && !useOpenAI) {
    return res.json({ ddc: local.code, label: local.label, confidence: local.score, match: 'local' });
  }

  if (useOpenAI && process.env.OPENAI_API_KEY) {
    try {
      const prompt = `You are a DDC classification assistant. Given the following OCR text extracted from a book (title, subtitle, maybe blurbs). Suggest the most appropriate Dewey Decimal Classification main number (3-digit or 3-digit plus decimals if precise), a short label, and a 1-2 sentence rationale. Respond in JSON with keys: ddc, label, rationale.\\n\\nOCR TEXT:\\n${text}\\n`;
      const body = {
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: 'You classify text into Dewey Decimal 3-digit main classes.' }, { role: 'user', content: prompt }],
        max_tokens: 300
      };
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify(body)
      });
      const j = await r.json();
      const assistantText = j?.choices?.[0]?.message?.content || '';
      let parsed = null;
      try { parsed = JSON.parse(assistantText); } catch (e) {
        const maybe = assistantText.substring(assistantText.indexOf('{'), assistantText.lastIndexOf('}') + 1);
        try { parsed = JSON.parse(maybe); } catch (e2) { parsed = null; }
      }
      if (parsed) return res.json({ ddc: parsed.ddc, label: parsed.label, rationale: parsed.rationale, confidence: 0.85 });
      return res.json({ error: 'OpenAI returned unparsable output', raw: assistantText });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'OpenAI request failed', detail: String(err) });
    }
  }

  if (local) return res.json({ ddc: local.code, label: local.label, confidence: local.score, match: 'local-fallback' });
  return res.json({ ddc: null, label: null, confidence: 0, match: 'no-match' });
};
