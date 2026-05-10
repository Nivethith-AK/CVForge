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
          CVForge ("we," "us," "our," or "Company") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our resume analysis service.
        </p>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">2. Information We Collect</h4>
        <p>We may collect the following information:</p>
        <ul className="list-disc list-inside ml-2 space-y-1 mt-2">
          <li>PDF resume files you upload</li>
          <li>Automatically extracted resume text</li>
          <li>Browser information and IP address</li>
          <li>Usage statistics and performance data</li>
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
          We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
        </p>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">5. Data Retention</h4>
        <p>
          Uploaded resumes and extracted data are processed in real-time and are not stored permanently on our servers unless explicitly saved by you.
        </p>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">6. Contact Us</h4>
        <p>
          If you have questions about this Privacy Policy, please contact us at privacy@cv-ai.com
        </p>
      </section>
    </div>
  );
}
