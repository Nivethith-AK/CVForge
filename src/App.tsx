/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/layout/Navbar';
import { UploadSection } from './components/UploadSection';
import { Dashboard } from './components/Dashboard';
import { Modal } from './components/Modal';
import { PrivacyPolicyContent } from './components/PrivacyPolicyContent';
import { TermsOfServiceContent } from './components/TermsOfServiceContent';
import { ApiDocumentationContent } from './components/ApiDocumentationContent';
import { analyzeResumeStream } from './services/geminiService';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import type { ResumeAnalysis } from './types/resume';
import type { PreparedPdfUpload } from './hooks/usePdfUpload';

async function extractTextLocallyFromPdf(file: File): Promise<string> {
  if (pdfjsLib?.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
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

function parsePdfWithProgress(
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file); // Field name 'file' as requested

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/parse-pdf');
    xhr.responseType = 'json';

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(99, (event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        const payload = xhr.response as { error?: string, details?: string } | null;
        const serverError = payload?.details || payload?.error || 'Failed to parse the PDF document.';

        // If the server-side parser fails on Vercel, extract the text directly in the browser.
        if (serverError.includes('DOMMatrix') || serverError.includes('pdf-parse')) {
          extractTextLocallyFromPdf(file)
            .then((text) => {
              onProgress(100);
              resolve(text);
            })
            .catch((localError) => {
              reject(new Error(`${serverError} (browser fallback failed: ${localError instanceof Error ? localError.message : String(localError)})`));
            });
          return;
        }

        reject(new Error(serverError));
        return;
      }
      resolve(xhr.response?.text ?? '');
    };

    xhr.onerror = () => reject(new Error('Network error while uploading the PDF.'));
    xhr.send(formData);
  });
}

export default function App() {
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<'privacy' | 'terms' | 'api' | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setUploadProgress(0);

    try {
      // 1. Upload to backend to parse PDF using the requested 'file' field and buffer logic
      const text = await parsePdfWithProgress(file, (progress) => {
        setUploadProgress(Math.min(50, progress));
      });

      if (!text || text.trim().length === 0) {
        throw new Error('No readable text found in the PDF.');
      }

      // 2. Send text to Gemini API with streaming progress
      const result = await analyzeResumeStream(text, (progress) => {
        setUploadProgress(50 + (progress * 0.5));
      });
      
      setUploadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnalysis(result);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setUploadProgress(0), 200);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-200 font-sans flex flex-col transition-colors duration-300">
      <Navbar onHomeClick={handleReset} />
      
      <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 relative z-10 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {!analysis ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full flex justify-center"
            >
              <UploadSection 
                onFileUpload={handleFileUpload} 
                isLoading={isLoading} 
                uploadProgress={uploadProgress}
                error={error} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full"
            >
              <Dashboard analysis={analysis} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="w-full min-h-[48px] py-4 sm:py-0 bg-black/5 dark:bg-black/40 border-t border-black/5 dark:border-white/5 backdrop-blur-md flex flex-col sm:flex-row items-center justify-center sm:justify-between px-4 sm:px-8 gap-4 sm:gap-0 text-[11px] text-slate-500 z-10 mt-auto transition-colors duration-300">
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          <button onClick={() => setOpenModal('privacy')} className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">Privacy Policy</button>
          <button onClick={() => setOpenModal('terms')} className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">Terms of Service</button>
          <button onClick={() => setOpenModal('api')} className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">API Documentation</button>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span>AI Engine: Gemini Pro 3.1</span>
        </div>
      </footer>

      <Modal isOpen={openModal === 'privacy'} onClose={() => setOpenModal(null)} title="Privacy Policy"><PrivacyPolicyContent /></Modal>
      <Modal isOpen={openModal === 'terms'} onClose={() => setOpenModal(null)} title="Terms of Service"><TermsOfServiceContent /></Modal>
      <Modal isOpen={openModal === 'api'} onClose={() => setOpenModal(null)} title="API Documentation"><ApiDocumentationContent /></Modal>

      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 dark:bg-blue-600/20 blur-[120px] pointer-events-none -z-10 transition-colors duration-300" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 dark:bg-indigo-600/20 blur-[120px] pointer-events-none -z-10 transition-colors duration-300" />
    </div>
  );
}
