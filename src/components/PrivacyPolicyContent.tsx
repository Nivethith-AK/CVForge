import { Separator } from './ui/separator';

export function PrivacyPolicyContent() {
  return (
    <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 transition-colors duration-300">
      <section>
        <h3 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">Privacy Policy</h3>
        <p>Last updated: May 2026</p>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">1. Introduction</h4>
        <p>
          CVForge ("we," "us," or "our") respects your privacy. This Privacy Policy explains how we collect, use, and protect information when you use our resume analysis platform.
        </p>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">2. Information We Collect</h4>
        <p>We may collect the following information:</p>
        <ul className="list-disc list-inside ml-2 space-y-1 mt-2">
          <li>PDF resume files you upload</li>
          <li>Automatically extracted resume text</li>
          <li>Basic technical data (such as browser type and request metadata)</li>
          <li>Usage and performance information to improve reliability</li>
        </ul>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">3. How We Use Your Information</h4>
        <p>We use the information we collect to:</p>
        <ul className="list-disc list-inside ml-2 space-y-1 mt-2">
          <li>Analyze and optimize your resume</li>
          <li>Provide ATS compatibility scores</li>
          <li>Generate tailored resume suggestions</li>
          <li>Improve our services and user experience</li>
          <li>Ensure security and prevent fraud</li>
        </ul>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">4. Data Security</h4>
        <p>
          We use reasonable technical and organizational safeguards to protect data from unauthorized access, disclosure, or misuse. No internet-based service can be guaranteed as 100% secure.
        </p>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">5. Data Retention</h4>
        <p>
          Uploaded resumes and extracted text are processed to provide analysis results. We aim to avoid unnecessary long-term storage and retain data only as needed for operation, troubleshooting, and legal obligations.
        </p>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">6. Contact Us</h4>
        <p>
          If you have questions about this Privacy Policy, contact us using the social links available in the site footer.
        </p>
      </section>
    </div>
  );
}
