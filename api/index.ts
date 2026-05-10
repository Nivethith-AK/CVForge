import 'dotenv/config';
import express from 'express';
import path from 'path';
import multer from 'multer';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

// Polyfills for Node.js environment
if (typeof global !== 'undefined' && !(global as any).DOMMatrix) {
  (global as any).DOMMatrix = class DOMMatrix {
    a=1; b=0; c=0; d=1; e=0; f=0;
    constructor() {}
    static fromFloat32Array() { return new DOMMatrix(); }
    static fromFloat64Array() { return new DOMMatrix(); }
  };
}
if (typeof global !== 'undefined' && !(global as any).Image) {
  (global as any).Image = class Image {};
}

const app = express();
app.use(express.json());

// Setup Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Health check
app.get('/api/health', (req, res) => {
  const rawKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
  res.json({ 
    status: 'ok', 
    isVercel: !!process.env.VERCEL,
    hasKey: !!rawKey,
    keyLength: rawKey?.length || 0
  });
});

async function callOpenRouter(apiKey: string, messages: any[]) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim().replace(/^["']|["']$/g, '')}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://cvforge-lake.vercel.app',
      'X-Title': 'CVForge',
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      messages,
      temperature: 0,
    }),
  });
  if (!response.ok) throw new Error('API request failed');
  return response.json();
}

function normalizeResumeDraft(draft: string) {
  return draft.replace(/```[\s\S]*?```/g, '').trim();
}

async function generateTailoredResumeDraft(apiKey: string, text: string, analysis: any) {
  const payload = await callOpenRouter(apiKey, [
    { role: 'system', content: 'You rewrite resumes. Return only plain text.' },
    { role: 'user', content: `Rewrite this resume: ${text}` }
  ]);
  return payload?.choices?.[0]?.message?.content || 'Draft failed';
}

function extractJsonObject(text: string) {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  if (startIndex === -1 || endIndex === -1) throw new Error('No JSON found');
  return JSON.parse(text.slice(startIndex, endIndex + 1));
}

// Routes
app.post('/api/parse-pdf', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    
    // PDF.js Text Extraction
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    }

    const data = new Uint8Array(req.file.buffer);
    const pdf = await pdfjsLib.getDocument({ data, disableWorker: true, verbosity: 0 }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item: any) => item.str || '').join(' ') + '\n';
      await page.cleanup();
    }
    await pdf.destroy();
    
    if (!fullText.trim()) throw new Error('Empty PDF');
    res.json({ text: fullText });
  } catch (err: any) {
    res.status(500).json({ error: 'Parse failed', details: err.message });
  }
});

app.post('/api/analyze-resume-stream', async (req, res) => {
  try {
    const { text } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'No API key' });

    res.setHeader('Content-Type', 'text/event-stream');
    const send = (event: string, data: any) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    send('progress', { stage: 'analyzing', percent: 20 });
    const payload = await callOpenRouter(apiKey, [
      { role: 'system', content: 'Return valid JSON.' },
      { role: 'user', content: `Analyze this resume: ${text}` }
    ]);
    
    const parsed = extractJsonObject(payload?.choices?.[0]?.message?.content || '{}');
    send('progress', { stage: 'tailoring', percent: 60 });
    parsed.tailoredResume = normalizeResumeDraft(await generateTailoredResumeDraft(apiKey, text, parsed));
    
    send('progress', { stage: 'complete', percent: 100 });
    send('result', parsed);
    res.end();
  } catch (err: any) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// Vite / Static files
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}
