import { Separator } from './ui/separator';

export function TermsOfServiceContent() {
  return (
    <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 transition-colors duration-300">
      <section>
        <h3 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">Terms of Service</h3>
        <p>Last updated: May 2026</p>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">1. Acceptance of Terms</h4>
        <p>
          By accessing and using CVForge, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
        </p>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">2. Use License</h4>
        <p>
          Permission is granted to temporarily download one copy of the materials (information or software) on CVForge for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
        </p>
        <ul className="list-disc list-inside ml-2 space-y-1 mt-2">
          <li>Modify or copy the materials</li>
          <li>Use the materials for any commercial purpose or for any public display</li>
          <li>Attempt to decompile or reverse engineer any software</li>
          <li>Remove any copyright or proprietary notations</li>
          <li>Transfer the materials to another person</li>
          <li>Upload or transmit viruses or any other malicious code</li>
        </ul>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">3. Disclaimer</h4>
        <p>
          The materials on CVForge are provided on an 'as is' basis. CVForge makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
        </p>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">4. Limitations</h4>
        <p>
          In no event shall CVForge or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on CVForge.
        </p>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">5. Accuracy of Materials</h4>
        <p>
          The materials appearing on CVForge could include technical, typographical, or photographic errors. CVForge does not warrant that any of the materials on the platform are accurate, complete, or current. CVForge may make changes to the materials contained on the platform at any time without notice.
        </p>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">6. Links</h4>
        <p>
          CVForge has not reviewed all of the sites linked to the platform and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by CVForge of the site. Use of any such linked website is at the user's own risk.
        </p>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">7. Modifications</h4>
        <p>
          CVForge may revise these terms of service for the platform at any time without notice. By using the platform, you are agreeing to be bound by the then current version of these terms of service.
        </p>
      </section>

      <Separator />

      <section>
        <h4 className="text-slate-900 dark:text-white font-semibold mb-2 transition-colors duration-300">8. Governing Law</h4>
        <p>
          These terms and conditions are governed by and construed in accordance with the laws of the United States, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
        </p>
      </section>
    </div>
  );
}
