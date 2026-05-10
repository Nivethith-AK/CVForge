import { Separator } from './ui/separator';

export function ApiDocumentationContent() {
  return (
    <div className="space-y-8 text-sm text-slate-700 dark:text-slate-300 transition-colors duration-300">
      <section>
        <h3 className="text-slate-900 dark:text-white font-semibold mb-2 text-lg transition-colors duration-300">API Documentation</h3>
        <p>CVForge provides a set of REST APIs for resume analysis and processing.</p>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">Base URL</h4>
        <code className="bg-slate-100 dark:bg-black/40 px-3 py-1 rounded border border-slate-200 dark:border-white/10 block text-slate-900 dark:text-white transition-colors duration-300">https://api.cv-ai.com/v1</code>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">Authentication</h4>
        <p>All API requests require authentication using an API key provided in the request header:</p>
        <code className="bg-slate-100 dark:bg-black/40 px-3 py-1 rounded border border-slate-200 dark:border-white/10 block mt-2 text-slate-900 dark:text-white transition-colors duration-300">Authorization: Bearer YOUR_API_KEY</code>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">Endpoints</h4>
        
        <div className="space-y-3 mt-3">
          <div className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded p-3 transition-colors duration-300">
            <p className="text-slate-900 dark:text-white font-mono text-xs mb-2 transition-colors duration-300">POST /parse-pdf</p>
            <p className="mb-2">Extract text from a PDF resume file.</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs transition-colors duration-300">Request: multipart/form-data with 'file' parameter</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs transition-colors duration-300">Response: JSON with extracted text</p>
          </div>

          <div className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded p-3 transition-colors duration-300">
            <p className="text-slate-900 dark:text-white font-mono text-xs mb-2 transition-colors duration-300">POST /analyze-resume</p>
            <p className="mb-2">Analyze a resume for ATS compatibility.</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs transition-colors duration-300">Request: JSON with 'text' property containing resume content</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs transition-colors duration-300">Response: JSON with analysis results including ATS score, strengths, weaknesses, and suggestions</p>
          </div>

          <div className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded p-3 transition-colors duration-300">
            <p className="text-slate-900 dark:text-white font-mono text-xs mb-2 transition-colors duration-300">POST /analyze-resume-stream</p>
            <p className="mb-2">Analyze a resume with real-time progress updates using Server-Sent Events.</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs transition-colors duration-300">Request: JSON with 'text' property</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs transition-colors duration-300">Response: Server-Sent Events stream with progress updates and final analysis result</p>
          </div>
        </div>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">Response Format</h4>
        <pre className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded p-3 overflow-x-auto text-xs text-slate-800 dark:text-slate-300 transition-colors duration-300">
{`{
  "atsScore": 85,
  "strengths": ["Clear structure", "Relevant keywords"],
  "weaknesses": ["Gaps in employment"],
  "improvements": ["Add metrics", "Quantify achievements"],
  "recommendedRoles": ["Senior Engineer", "Tech Lead"],
  "summary": "Strong resume...",
  "tailoredResume": "Formatted resume text..."
}`}
        </pre>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">Rate Limiting</h4>
        <p>API requests are limited to 100 requests per minute per API key. Exceeded requests will receive a 429 (Too Many Requests) response.</p>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">Error Handling</h4>
        <p>All errors are returned in the following format:</p>
        <pre className="bg-black/40 border border-white/10 rounded p-3 overflow-x-auto text-xs text-slate-300 mt-2">
{`{
  "error": "Error message describing what went wrong"
}`}
        </pre>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">Support</h4>
        <p>For API support and questions, please contact: api-support@cv-ai.com</p>
      </section>
    </div>
  );
}
