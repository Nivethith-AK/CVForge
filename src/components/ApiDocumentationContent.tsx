import { Separator } from './ui/separator';

export function ApiDocumentationContent() {
  return (
    <div className="space-y-8 text-sm text-slate-700 dark:text-slate-300 transition-colors duration-300">
      <section>
        <h3 className="text-slate-900 dark:text-white font-semibold mb-2 text-lg transition-colors duration-300">API Documentation</h3>
        <p>CVForge provides REST API endpoints for PDF parsing and AI-powered resume analysis.</p>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">Base URL</h4>
        <code className="bg-slate-100 dark:bg-black/40 px-3 py-1 rounded border border-slate-200 dark:border-white/10 block text-slate-900 dark:text-white transition-colors duration-300">/api</code>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">Authentication</h4>
        <p>No client API key is required for frontend calls to these endpoints in the current deployment.</p>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">Endpoints</h4>
        
        <div className="space-y-3 mt-3">
          <div className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded p-3 transition-colors duration-300">
            <p className="text-slate-900 dark:text-white font-mono text-xs mb-2 transition-colors duration-300">POST /parse-pdf</p>
            <p className="mb-2">Extract text from an uploaded PDF and validate that it looks like a resume/CV.</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs transition-colors duration-300">Request: multipart/form-data with either 'file' or 'resume'</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs transition-colors duration-300">Success response: {`{ "text": "..." }`}</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs transition-colors duration-300">Validation error: {`{ "error": "Please upload a correct resume or CV PDF file." }`}</p>
          </div>

          <div className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded p-3 transition-colors duration-300">
            <p className="text-slate-900 dark:text-white font-mono text-xs mb-2 transition-colors duration-300">POST /analyze-resume</p>
            <p className="mb-2">Analyze a resume for ATS compatibility.</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs transition-colors duration-300">Request: JSON with 'text' property containing resume content</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs transition-colors duration-300">Response: JSON with ATS score, strengths, weaknesses, missing skills, improvements, roles, summary, and tailored resume</p>
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
        <p>Rate limiting may be applied at the hosting or gateway layer. No fixed public limit is guaranteed.</p>
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
        <p>For support, use the links in the footer (GitHub, LinkedIn, Instagram).</p>
      </section>
    </div>
  );
}
