import 'dotenv/config';
import express from 'express';
import path from 'path';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';

const app = express();
app.use(express.json());

// Setup Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

const PORT = Number(process.env.PORT || 3001);

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
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'API request failed');
  }
  return response.json();
}

function normalizeResumeDraft(draft: string) {
  return draft.replace(/```[\s\S]*?```/g, '').trim();
}

async function generateTailoredResumeDraft(apiKey: string, text: string, analysis: any) {
  const payload = await callOpenRouter(apiKey, [
    { role: 'system', content: 'You rewrite resumes. Return only plain text.' },
    { role: 'user', content: `Rewrite this resume based on analysis: ${text}` }
  ]);
  return payload?.choices?.[0]?.message?.content || 'Draft failed';
}

function extractJsonObject(text: string) {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  if (startIndex === -1 || endIndex === -1) throw new Error('No JSON found in model response');
  return JSON.parse(text.slice(startIndex, endIndex + 1));
}

// PDF Extraction Logic using pdf-parse (as requested)
export async function extractTextFromPDF(buffer: Buffer) {
  try {
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    await parser.destroy();
    return data.text;
  } catch (err: any) {
    throw new Error(`pdf-parse failed: ${err.message}`);
  }
}

// API Route for PDF parsing
app.post('/api/parse-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log("File received:", req.file.originalname);

    const buffer = req.file.buffer;
    const text = await extractTextFromPDF(buffer);

    console.log("Extracted text length:", text?.length || 0);

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Extracted text is empty. The PDF might be an image or protected.' });
    }

    return res.json({ text });
  } catch (err: any) {
    console.error("PDF Parse Error:", err);
    return res.status(500).json({ 
      error: 'Failed to parse the PDF document', 
      details: err.message 
    });
  }
});

// Streaming analysis route
app.post('/api/analyze-resume-stream', async (req, res) => {
  try {
    const { text } = req.body;
    let apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'No API key' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const send = (event: string, data: any) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    send('progress', { stage: 'analyzing', percent: 20 });
    const payload = await callOpenRouter(apiKey, [
      { role: 'system', content: 'Return valid JSON.' },
      { role: 'user', content: `Analyze this resume: ${text}` }
    ]);
    
    const parsed = extractJsonObject(payload?.choices?.[0]?.message?.content || '{}');
    send('progress', { stage: 'tailoring', percent: 60 });
    
    const tailored = await generateTailoredResumeDraft(apiKey, text, parsed);
    parsed.tailoredResume = normalizeResumeDraft(tailored);
    
    send('progress', { stage: 'complete', percent: 100 });
    send('result', parsed);
    res.end();
  } catch (err: any) {
    console.error('SSE Error:', err);
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// Static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}
