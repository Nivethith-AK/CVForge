import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

const app = express();
const PORT = Number(process.env.PORT || 3001);

// Setup Multer for parsing multipart/form-data
const storage = multer.memoryStorage();
const upload = multer({ storage });

async function startServer() {
  app.use(express.json());

  async function callOpenRouter(apiKey: string, messages: Array<{ role: string; content: string }>) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://cvforge-lake.vercel.app',
        'X-Title': 'CVForge - AI Resume Analyzer',
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error?.message || 'Failed to generate response from the analysis API.');
    }

    return response.json() as Promise<{ choices?: Array<{ message?: { content?: string } }> }>;
  }

  function buildFallbackTailoredResume(text: string, analysis: { summary?: string; strengths?: string[]; improvements?: string[]; recommendedRoles?: string[]; missingSkills?: string[] }) {
    const strengths = (analysis.strengths ?? []).slice(0, 5);
    const improvements = (analysis.improvements ?? []).slice(0, 5);
    const roles = (analysis.recommendedRoles ?? []).slice(0, 4);
    const missingSkills = (analysis.missingSkills ?? []).slice(0, 8);

    return [
      'FULL NAME',
      '[Candidate Name]',
      '',
      'Contact Information',
      '[Phone] | [Email] | [Location]',
      '',
      'Professional Summary',
      analysis.summary || 'Experienced professional with a track record of delivering results and collaborating across teams.',
      '',
      'Core Skills',
      ...strengths.map((item) => `- ${item}`),
      '',
      'Professional Experience',
      '- [Role / Organization] | [Dates]',
      '  - [Use the source resume experience and add quantified achievements where accurate.]',
      '',
      'Education',
      '- [Degree / Institution] | [Dates]',
      '  - [List your most relevant education, certifications, and training.]',
      '',
      'Certifications / Training',
      '- [Add only certifications and training already supported by the source resume.]',
      '',
      'Languages',
      '- [List languages already supported by the source resume.]',
      '',
      'Additional Information',
      '- [Add professional memberships, volunteer work, or other relevant details if supported by the source resume.]',
      '',
      'Resume Focus Areas',
      ...improvements.map((item) => `- ${item}`),
      '',
      'Recommended Target Roles',
      ...roles.map((item) => `- ${item}`),
      '',
      'Suggested Skills to Add If Accurate',
      ...missingSkills.map((item) => `- ${item}`),
    ].join('\n');
  }

  function normalizeResumeDraft(draft: string) {
    const normalizedLines = draft
      .replace(/```[\s\S]*?```/g, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line, index, lines) => line.length > 0 || lines[index - 1]?.length > 0)
      .map((line) => line.replace(/^#+\s*/, ''));

    return normalizedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  async function generateTailoredResumeDraft(
    apiKey: string,
    text: string,
    analysis: { summary?: string; strengths?: string[]; improvements?: string[]; recommendedRoles?: string[]; missingSkills?: string[] }
  ) {
    const draftPrompt = `Rewrite the resume below into a clean, ATS-friendly plain-text resume draft.

Rules:
- Preserve only facts that already appear in the source resume or the analysis context.
- Do not invent employers, degrees, certifications, metrics, or technical experience.
- If something is unknown, omit it or leave a clear placeholder like [Add details here].
- Format it like a professional resume with this exact section order when possible:
  1. Full Name
  2. Contact Information
  3. Professional Summary
  4. Core Skills
  5. Professional Experience
  6. Education
  7. Certifications / Training
  8. Additional Information
- Keep the writing concise, ATS-friendly, and well-bulleted.
- Return only the resume text. No markdown fences, no commentary.

Analysis context:
Summary: ${analysis.summary || 'N/A'}
Strengths: ${(analysis.strengths ?? []).join('; ') || 'N/A'}
Improvements: ${(analysis.improvements ?? []).join('; ') || 'N/A'}
Recommended roles: ${(analysis.recommendedRoles ?? []).join('; ') || 'N/A'}
Missing skills: ${(analysis.missingSkills ?? []).join('; ') || 'N/A'}

Source resume:
"""
${text}
"""`;

    const payload = await callOpenRouter(apiKey, [
      {
        role: 'system',
        content: 'You rewrite resumes. Return only plain text.',
      },
      {
        role: 'user',
        content: draftPrompt,
      },
    ]);

    const draft = payload?.choices?.[0]?.message?.content?.trim();
    return draft && draft.length > 0 ? draft : buildFallbackTailoredResume(text, analysis);
  }

  function extractJsonObject(text: string) {
    const trimmed = text.trim();

    try {
      return JSON.parse(trimmed);
    } catch {
      const startIndex = trimmed.indexOf('{');
      const endIndex = trimmed.lastIndexOf('}');

      if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
        throw new Error('Failed to parse the model response as JSON.');
      }

      return JSON.parse(trimmed.slice(startIndex, endIndex + 1));
    }
  }

  // API route for streaming analysis with real-time progress
  app.post('/api/analyze-resume-stream', async (req, res) => {
    try {
      const { text } = req.body ?? {};

      if (typeof text !== 'string' || text.trim().length === 0) {
        res.status(400).json({ error: 'Resume text is required.' });
        return;
      }

      const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: 'Server API key is not configured.' });
        return;
      }

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      try {
        // Stage 1: Analyzing ATS compatibility
        sendEvent('progress', { stage: 'analyzing', percent: 15 });

        const prompt = `You are an expert tech recruiter and ATS system. First, determine if the provided text is actually a resume or CV. If it is NOT a resume (e.g., a manual, a recipe, a random article, or gibberish), return ONLY this valid JSON:
{ "isResume": false }

If it IS a resume, analyze it for software engineering and tech-related roles, and return only valid JSON with these keys:
- isResume: true
- atsScore: number from 0 to 100
- strengths: string[]
- weaknesses: string[]
- missingSkills: string[]
- improvements: string[]
- recommendedRoles: string[]
- summary: string

Do not include tailoredResume in the analysis JSON.
The tailored resume will be generated separately using a strict ATS-friendly structure.

Resume Text:
"""
${text}
"""`;

        const payload = await callOpenRouter(apiKey, [
          {
            role: 'system',
            content: 'Return only valid JSON. Do not wrap the response in markdown or code fences.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ]);
        const content = payload?.choices?.[0]?.message?.content;

        if (typeof content !== 'string' || content.trim().length === 0) {
          throw new Error('Failed to generate a structured response.');
        }

        sendEvent('progress', { stage: 'parsing', percent: 45 });

        const parsed = extractJsonObject(content);

        if (parsed.isResume === false) {
          throw new Error('The uploaded document does not appear to be a valid resume. Please upload a real resume PDF.');
        }

        // Stage 2: Generating tailored resume
        sendEvent('progress', { stage: 'tailoring', percent: 70 });

        parsed.tailoredResume = normalizeResumeDraft(
          await generateTailoredResumeDraft(apiKey, text, parsed)
        );

        // Stage 3: Complete
        sendEvent('progress', { stage: 'complete', percent: 100 });
        sendEvent('result', parsed);
        res.end();
      } catch (err: any) {
        console.error('Error in streaming analysis:', err);
        sendEvent('error', { error: err.message || 'Analysis failed.' });
        res.end();
      }
    } catch (error) {
      console.error('Error setting up stream:', error);
      res.status(500).json({ error: 'Failed to set up analysis stream.' });
    }
  });

  // API route to analyze resume text with Gemini on the server.
  app.post('/api/analyze-resume', async (req, res) => {
    try {
      const { text } = req.body ?? {};

      if (typeof text !== 'string' || text.trim().length === 0) {
        res.status(400).json({ error: 'Resume text is required.' });
        return;
      }

      const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: 'Server API key is not configured.' });
        return;
      }

      const prompt = `You are an expert tech recruiter and ATS system. First, determine if the provided text is actually a resume or CV. If it is NOT a resume (e.g., a manual, a recipe, a random article, or gibberish), return ONLY this valid JSON:
{ "isResume": false }

If it IS a resume, analyze it for software engineering and tech-related roles, and return only valid JSON with these keys:
- isResume: true
- atsScore: number from 0 to 100
- strengths: string[]
- weaknesses: string[]
- missingSkills: string[]
- improvements: string[]
- recommendedRoles: string[]
- summary: string

Do not include tailoredResume in the analysis JSON.
The tailored resume will be generated separately using a strict ATS-friendly structure.

Resume Text:
"""
${text}
"""`;

      const payload = await callOpenRouter(apiKey, [
        {
          role: 'system',
          content: 'Return only valid JSON. Do not wrap the response in markdown or code fences.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);
      const content = payload?.choices?.[0]?.message?.content;

      if (typeof content !== 'string' || content.trim().length === 0) {
        throw new Error('Failed to generate a structured response.');
      }

      const parsed = extractJsonObject(content);
      
      if (parsed.isResume === false) {
        throw new Error('The uploaded document does not appear to be a valid resume. Please upload a real resume PDF.');
      }
      
      parsed.tailoredResume = normalizeResumeDraft(await generateTailoredResumeDraft(apiKey, text, parsed));
      res.json(parsed);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      res.status(500).json({ error: 'Failed to analyze resume.' });
    }
  });

  // API Route to parse PDF
  app.post('/api/parse-pdf', upload.single('resume'), async (req, res) => {
    try {
      if (!req.file) {
        console.error('No file received in /api/parse-pdf');
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      console.log('File received for parsing:', req.file.originalname);
      console.log('File size:', req.file.size, 'bytes');

      // Set worker src for Node.js
      // @ts-ignore
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        // @ts-ignore
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.js';
      }

      const data = new Uint8Array(req.file.buffer);
      const loadingTask = pdfjsLib.getDocument({
        data,
        useSystemFonts: true,
        disableFontFace: true,
      });

      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        // @ts-ignore - items property exists but type definition might be complex
        const strings = content.items.map((item: any) => item.str || '');
        fullText += strings.join(' ') + '\n';
        // Cleanup page resources
        await page.cleanup();
      }

      // Explicitly destroy the document to free memory
      await pdf.destroy();

      if (!fullText.trim()) {
        console.error('Could not extract text from PDF (empty result)');
        res.status(400).json({ error: 'Could not extract text from PDF. It might be an image-only PDF or encrypted.' });
        return;
      }

      console.log('Successfully extracted text, length:', fullText.length);
      res.json({ text: fullText });
    } catch (error: any) {
      console.error('Error parsing PDF:', error);
      res.status(500).json({ error: `Failed to process the PDF document: ${error.message}` });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

// Export the app for Vercel
export default app;

if (!process.env.VERCEL) {
  startServer().catch(console.error);
}
