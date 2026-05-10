import 'dotenv/config';
import express from 'express';
import path from 'path';
import multer from 'multer';

const app = express();
app.use(express.json());

// Register process-level error handlers once per runtime.
const globalFlag = globalThis as typeof globalThis & { __cvforgeHandlersRegistered?: boolean };
if (!globalFlag.__cvforgeHandlersRegistered) {
  try {
    if (typeof process !== 'undefined' && typeof process.on === 'function') {
      process.on('uncaughtException', (error) => {
        console.error('Uncaught exception in API runtime:', error);
      });

      process.on('unhandledRejection', (reason) => {
        console.error('Unhandled rejection in API runtime:', reason);
      });
    }
  } catch (error) {
    console.error('Failed to register process-level handlers:', error);
  }

  globalFlag.__cvforgeHandlersRegistered = true;
}

app.use((req, _res, next) => {
  const requestId = Math.random().toString(36).slice(2, 10);
  (req as any).requestId = requestId;
  next();
});

// Setup Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

const PORT = Number(process.env.PORT || 3001);

// Health check
app.get('/api/health', (req, res) => {
  try {
    const rawKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
    res.json({
      status: 'ok',
      isVercel: !!process.env.VERCEL,
      hasKey: !!rawKey,
      keyLength: rawKey?.length || 0,
      nodeVersion: process.version,
      uptimeSeconds: Math.round(process.uptime()),
    });
  } catch (error: any) {
    console.error('Health route failed:', error);
    res.status(500).json({
      status: 'error',
      error: error?.message || 'Health check failed',
    });
  }
});

async function callOpenRouter(apiKey: string, messages: any[]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal: controller.signal,
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

  clearTimeout(timeout);

  if (!response.ok) {
    const rawError = await response.text().catch(() => '');
    let parsedError: any = {};

    try {
      parsedError = rawError ? JSON.parse(rawError) : {};
    } catch {
      parsedError = { error: { message: rawError } };
    }

    throw new Error(parsedError.error?.message || `OpenRouter request failed with status ${response.status}`);
  }

  const rawPayload = await response.text();
  return rawPayload ? JSON.parse(rawPayload) : {};
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
    // Prefer the node-targeted build to avoid browser-only globals (e.g. DOMMatrix)
    // that can crash in serverless runtimes.
    let module: any;
    try {
      const nodeBuildEntry = 'pdf-parse/dist/node/esm/index.js';
      module = await import(nodeBuildEntry);
    } catch {
      module = await import('pdf-parse');
    }

    const PDFParseCtor = module?.PDFParse;

    if (typeof PDFParseCtor === 'function') {
      const parser = new PDFParseCtor({ data: buffer });
      const data = await parser.getText();
      if (typeof parser.destroy === 'function') {
        await parser.destroy();
      }
      return data.text;
    }

    const fallback = module?.default;
    if (typeof fallback === 'function') {
      const data = await fallback(buffer);
      return data?.text || '';
    }

    throw new Error('Unsupported pdf-parse module shape');
  } catch (err: any) {
    throw new Error(`pdf-parse failed: ${err.message}`);
  }
}

// API Route for PDF parsing
app.post('/api/parse-pdf', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'resume', maxCount: 1 }]), async (req, res) => {
  try {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const file = files?.file?.[0] || files?.resume?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received:', file.originalname);

    const buffer = file.buffer;
    const text = await extractTextFromPDF(buffer);

    console.log('Extracted text length:', text?.length || 0);

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Extracted text is empty. The PDF might be an image or protected.' });
    }

    return res.json({ text });
  } catch (err: any) {
    console.error('PDF Parse Error:', err);
    return res.status(500).json({ 
      error: 'Failed to parse the PDF document', 
      details: err.message 
    });
  }
});

// Non-streaming analysis route for compatibility with older frontend flows.
app.post('/api/analyze-resume', async (req, res) => {
  try {
    const { text } = req.body ?? {};
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'No API key' });
    }

    if (typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Resume text is required.' });
    }

    const payload = await callOpenRouter(apiKey, [
      { role: 'system', content: 'Return valid JSON only.' },
      { role: 'user', content: `Analyze this resume: ${text}` },
    ]);

    const parsed = extractJsonObject(payload?.choices?.[0]?.message?.content || '{}');
    const tailored = await generateTailoredResumeDraft(apiKey, text, parsed);
    parsed.tailoredResume = normalizeResumeDraft(tailored);

    return res.json(parsed);
  } catch (err: any) {
    console.error('Analyze route error:', err);
    return res.status(500).json({ error: err.message || 'Failed to analyze resume.' });
  }
});

// Streaming analysis route
app.post('/api/analyze-resume-stream', async (req, res) => {
  try {
    const { text } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'No API key' });
    if (typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Resume text is required.' });
    }

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

app.use((error: any, req: any, res: any, _next: any) => {
  const requestId = req?.requestId || 'unknown';
  console.error(`Unhandled express error [${requestId}]:`, error);

  if (res.headersSent) {
    return;
  }

  res.status(500).json({
    error: 'Internal server error',
    requestId,
  });
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
