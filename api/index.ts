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
  if (!draft || typeof draft !== 'string') return '';
  // Remove only markdown code blocks (``` ... ```)
  let normalized = draft.replace(/```[\s\S]*?```/g, '').trim();
  // If the entire content was removed, return the original
  if (!normalized && draft.trim()) {
    normalized = draft.trim();
  }
  return normalized;
}

async function generateTailoredResumeDraft(apiKey: string, text: string, analysis: any) {
  try {
    const payload = await callOpenRouter(apiKey, [
      { role: 'system', content: 'You rewrite resumes. Return only plain text and keep a clean, ready-to-submit resume structure.' },
      { role: 'user', content: `Rewrite this resume based on this analysis JSON and the source resume text. Keep the output as a polished resume with sections like summary, skills, experience, education, and certifications when relevant. Analysis JSON: ${JSON.stringify(analysis)}. Source resume text: ${text}` }
    ]);
    return payload?.choices?.[0]?.message?.content || text;
  } catch (error) {
    console.warn('Failed to generate tailored resume:', error);
    return text; // Fallback to original text if tailoring fails
  }
}

function extractJsonObject(text: string) {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  if (startIndex === -1 || endIndex === -1) throw new Error('No JSON found in model response');
  try {
    return JSON.parse(text.slice(startIndex, endIndex + 1));
  } catch (error) {
    console.error('Failed to parse JSON:', text.slice(startIndex, endIndex + 1));
    throw new Error(`Invalid JSON from model: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function toTrimmedString(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value).trim();
  }

  return '';
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => toTrimmedString(item))
      .filter((item) => item.length > 0);
  }

  const text = toTrimmedString(value);
  if (!text) {
    return [];
  }

  return text
    .split(/\r?\n|[;,•]/g)
    .map((item) => item.replace(/^[-*]\s*/, '').trim())
    .filter((item) => item.length > 0);
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))];
}

function firstNonEmptyString(...values: unknown[]) {
  for (const value of values) {
    const text = toTrimmedString(value);
    if (text) {
      return text;
    }
  }

  return '';
}

function deriveAtsScore(parsed: Record<string, any>, resumeText: string) {
  const explicitScore = Number(parsed.atsScore ?? parsed.score ?? parsed.matchScore ?? parsed.ATSScore);
  if (Number.isFinite(explicitScore)) {
    return Math.max(0, Math.min(100, Math.round(explicitScore)));
  }

  const skillCount = toStringArray(parsed.skills ?? parsed.keySkills ?? parsed.coreSkills).length;
  const experienceCount = Array.isArray(parsed.experience) ? parsed.experience.length : 0;
  const textSignals = [
    /python|javascript|typescript|sql|node\.js|react|azure|aws|gcp|machine learning|data/i.test(resumeText),
    /project|experience|education|certification/i.test(resumeText),
  ].filter(Boolean).length;

  const score = 48 + skillCount * 5 + experienceCount * 4 + textSignals * 8;
  return Math.max(35, Math.min(92, Math.round(score)));
}

function normalizeResumeAnalysis(parsed: Record<string, any>, resumeText: string, tailoredResume: string) {
  const name = firstNonEmptyString(parsed.name, parsed.fullName, parsed.candidateName);
  const title = firstNonEmptyString(parsed.title, parsed.role, parsed.professionalTitle, parsed.targetRole);
  const skills = uniqueStrings(toStringArray(parsed.skills ?? parsed.keySkills ?? parsed.coreSkills ?? parsed.technicalSkills));
  const strengths = uniqueStrings(
    toStringArray(parsed.strengths ?? parsed.keyStrengths ?? parsed.highlights ?? parsed.positiveSignals)
  );
  const weaknesses = uniqueStrings(
    toStringArray(parsed.weaknesses ?? parsed.improvementAreas ?? parsed.gaps ?? parsed.concerns)
  );
  const missingSkills = uniqueStrings(
    toStringArray(parsed.missingSkills ?? parsed.skillGaps ?? parsed.skillsToAdd ?? parsed.skillsMissing)
  );
  const improvements = uniqueStrings(
    toStringArray(
      parsed.improvements ?? parsed.recommendations ?? parsed.nextSteps ?? parsed.actionableNextSteps ?? parsed.suggestions
    )
  );
  const recommendedRoles = uniqueStrings(
    toStringArray(parsed.recommendedRoles ?? parsed.targetRoles ?? parsed.roles ?? parsed.roleSuggestions)
  );

  const summaryFromModel = firstNonEmptyString(
    parsed.summary,
    parsed.executiveSummary,
    parsed.professionalSummary,
    parsed.profileSummary
  );

  const summary =
    summaryFromModel ||
    `Candidate${name ? ` ${name}` : ''}${title ? ` is a ${title}` : ''}${skills.length ? ` with skills in ${skills.slice(0, 4).join(', ')}` : ''}.`;

  const resolvedStrengths = strengths.length
    ? strengths
    : uniqueStrings([
        title ? `Focused ${title} profile` : 'Clear professional profile',
        skills.length ? `Relevant skills include ${skills.slice(0, 4).join(', ')}` : 'Contains transferable technical experience',
        resumeText ? 'Resume text was successfully extracted' : 'Text extraction completed',
      ]);

  const resolvedWeaknesses = weaknesses.length
    ? weaknesses
    : uniqueStrings([
        skills.length < 5 ? 'Add more role-specific keywords if they are accurate' : '',
        'Strengthen impact metrics and measurable outcomes',
      ]);

  const resolvedMissingSkills = missingSkills.length
    ? missingSkills
    : uniqueStrings([
        'Quantifiable achievements',
        'Role-specific ATS keywords',
        skills.length ? '' : 'Technical skills aligned to the target role',
      ]);

  const resolvedImprovements = improvements.length
    ? improvements
    : uniqueStrings([
        'Tailor the summary to the target role',
        'Add stronger bullet points with measurable outcomes',
        'Place the most relevant technical skills near the top',
      ]);

  const resolvedRecommendedRoles = recommendedRoles.length
    ? recommendedRoles
    : uniqueStrings([
        title || (skills.includes('Python') ? 'Data Analyst' : ''),
        skills.includes('Python') || skills.includes('SQL') ? 'AI Engineer' : '',
        skills.includes('Node.js') ? 'Full Stack Developer' : '',
        'Resume-tailored professional roles',
      ]);

  const resolvedTailoredResume = firstNonEmptyString(tailoredResume, parsed.tailoredResume) || resumeText;

  return {
    atsScore: deriveAtsScore(parsed, resumeText),
    strengths: resolvedStrengths,
    weaknesses: resolvedWeaknesses,
    missingSkills: resolvedMissingSkills,
    improvements: resolvedImprovements,
    recommendedRoles: resolvedRecommendedRoles,
    summary,
    tailoredResume: normalizeResumeDraft(resolvedTailoredResume),
  };
}

async function ensureDomMatrixPolyfill() {
  if (typeof (globalThis as any).DOMMatrix !== 'undefined') {
    return;
  }

  try {
    const domMatrixModule: any = await import('@thednp/dommatrix');
    const DOMMatrixCtor = domMatrixModule?.default || domMatrixModule?.DOMMatrix || domMatrixModule;
    if (DOMMatrixCtor) {
      (globalThis as any).DOMMatrix = DOMMatrixCtor;
    }
  } catch (error) {
    console.warn('DOMMatrix polyfill could not be loaded:', error);
  }
}

async function extractWithPdfJs(buffer: Buffer): Promise<string> {
  const pdfjsEntry = 'pdfjs-dist/legacy/build/pdf.mjs';
  const pdfjs = await import(pdfjsEntry);
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  const doc = await loadingTask.promise;

  const pages: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = (content.items as Array<{ str?: string }>)
      .map((item) => item?.str || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (pageText.length > 0) {
      pages.push(pageText);
    }
  }

  return pages.join('\n\n').trim();
}

// PDF Extraction Logic using pdf-parse (as requested)
export async function extractTextFromPDF(buffer: Buffer) {
  try {
    await ensureDomMatrixPolyfill();

    try {
      const text = await extractWithPdfJs(buffer);
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (pdfJsError: any) {
      console.warn('pdfjs extraction failed, falling back to pdf-parse:', pdfJsError?.message || pdfJsError);
    }

    // Secondary fallback path.
    const module: any = await import('pdf-parse');
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

    throw new Error('No compatible PDF parser available');
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

    // Server-side lightweight resume validation: require several resume-like keywords
    const looksLikeResumeServer = (txt: string) => {
      if (!txt) return false;
      const lower = txt.toLowerCase();
      const keywords = ['education', 'experience', 'skills', 'summary', 'professional', 'work', 'employment', 'objective', 'contact', 'curriculum vitae', 'resume'];
      let found = 0;
      for (const kw of keywords) {
        if (lower.includes(kw)) found += 1;
      }
      return found >= 3 || lower.includes('curriculum vitae') || lower.includes('resume');
    };

    if (!looksLikeResumeServer(text)) {
      return res.status(400).json({ error: 'Please upload a correct resume or CV PDF file.' });
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
      { role: 'system', content: 'You are a professional resume analyst. Return ONLY valid JSON, no additional text.' },
      { role: 'user', content: `Analyze this resume and return JSON with these exact fields:
{
  "name": "candidate name",
  "title": "job title",
  "skills": ["skill1", "skill2"],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "missingSkills": ["skill gap 1", "skill gap 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "recommendedRoles": ["role1", "role2"],
  "atsScore": 75,
  "summary": "professional summary"
}

Resume: ${text}` },
    ]);

    const parsed = extractJsonObject(payload?.choices?.[0]?.message?.content || '{}');
    const tailored = await generateTailoredResumeDraft(apiKey, text, parsed);
    const normalized = normalizeResumeAnalysis(parsed, text, tailored);

    return res.json(normalized);
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
      { role: 'system', content: 'You are a professional resume analyst. Return ONLY valid JSON, no additional text.' },
      { role: 'user', content: `Analyze this resume and return JSON with these exact fields:
{
  "name": "candidate name",
  "title": "job title",
  "skills": ["skill1", "skill2"],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "missingSkills": ["skill gap 1", "skill gap 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "recommendedRoles": ["role1", "role2"],
  "atsScore": 75,
  "summary": "professional summary"
}

Resume: ${text}` }
    ]);
    
    const parsed = extractJsonObject(payload?.choices?.[0]?.message?.content || '{}');
    send('progress', { stage: 'tailoring', percent: 60 });
    
    const tailored = await generateTailoredResumeDraft(apiKey, text, parsed);
    const normalized = normalizeResumeAnalysis(parsed, text, tailored);
    
    send('progress', { stage: 'complete', percent: 100 });
    send('result', normalized);
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
