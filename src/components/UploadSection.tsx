/// <reference types="react" />
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { usePdfUpload, type PreparedPdfUpload } from '@/src/hooks/usePdfUpload';
import { AnimatedCounter } from './AnimatedCounter';

interface UploadSectionProps {
  onFileUpload: (file: File, preparedUpload: PreparedPdfUpload) => void | Promise<void>;
  isLoading: boolean;
  uploadProgress: number;
  error: string | null;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

export function UploadSection({ onFileUpload, isLoading, uploadProgress, error }: UploadSectionProps) {
  const { selectedFile, preparedUpload, isPreparing, uploadError, onDrop, clearUpload } = usePdfUpload();

  const [displayProgress, setDisplayProgress] = React.useState(0);

  React.useEffect(() => {
    if (!isLoading && !isPreparing) {
      setDisplayProgress(0);
      return;
    }

    // If we just started loading, do an initial quick ramp to show responsiveness
    setDisplayProgress((prev) => Math.max(prev, 12));

    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        // If server reports progress, gently catch up
        if (uploadProgress > prev) {
          const diff = uploadProgress - prev;
          const step = Math.max(0.6, diff * 0.18);
          return Math.min(uploadProgress, prev + step);
        }

        // If server is stalled (no reported progress), increment slowly up to 95%
        if (prev < 95) {
          return Number((prev + 0.25).toFixed(2));
        }

        return prev;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [uploadProgress, isLoading, isPreparing]);

  const handleAnalyze = useCallback(() => {
    if (!selectedFile || !preparedUpload || isLoading || isPreparing) {
      return;
    }

    void onFileUpload(selectedFile, preparedUpload);
  }, [isLoading, isPreparing, onFileUpload, preparedUpload, selectedFile]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    disabled: isLoading || isPreparing,
  } as any);

  const combinedError = uploadError || error;

  return (
    <div className="w-full max-w-2xl mx-auto bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 backdrop-blur-md rounded-3xl p-5 sm:p-8 flex flex-col gap-5 sm:gap-6 shadow-xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-colors duration-300">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2 transition-colors duration-300">
          Resume Upload
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 transition-colors duration-300">
          GitHub Repo:{' '}
          <a
            href="https://github.com/Nivethith-AK/CVForge"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            github.com/Nivethith-AK/CVForge
          </a>
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors duration-300">
          Upload your PDF resume to receive an instant, AI-driven ATS compatibility breakdown.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          'group border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl h-64 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-black/[0.03] to-black/[0.01] dark:from-white/[0.03] dark:to-white/[0.01] hover:from-black/[0.06] hover:to-black/[0.03] dark:hover:from-white/[0.06] dark:hover:to-white/[0.03] transition-all cursor-pointer',
          isDragActive && !isDragReject ? 'border-blue-500 bg-blue-500/10' : '',
          isDragReject ? 'border-red-500 bg-red-500/10' : '',
          (isLoading || isPreparing) ? 'pointer-events-none opacity-70' : ''
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-105 transition-transform">
            {(isLoading || isPreparing) ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
              {isPreparing
                ? 'Preparing your PDF...'
                : isLoading
                  ? uploadProgress < 100
                    ? 'Uploading your PDF...'
                    : 'Processing your PDF...'
                  : isDragActive
                    ? 'Drop your PDF here'
                    : 'Drag and drop your PDF'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isLoading
                ? uploadProgress < 100
                  ? 'Uploading the file to the server'
                  : 'Extracting text and analyzing the resume'
                : 'PDF only, max 10MB'}
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/20 px-4 py-3 transition-colors duration-300"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-900 dark:text-slate-100 truncate transition-colors duration-300">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              {!isLoading && !isPreparing && (
                <button
                  type="button"
                  onClick={clearUpload}
                  className="w-8 h-8 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
                  aria-label="Remove selected file"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-2"
          >
            <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400"
                style={{ width: `${displayProgress}%` }}
              />
            </div>
            <AnimatedCounter value={displayProgress} />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={!preparedUpload || isLoading || isPreparing}
        className={cn(
          'w-full h-11 rounded-xl font-medium transition-all',
          'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-900/30',
          (!preparedUpload || isLoading || isPreparing)
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:brightness-110'
        )}
      >
        {isPreparing ? 'Preparing file...' : isLoading ? 'Analyzing resume...' : 'Analyze Resume'}
      </button>

      <AnimatePresence>
        {combinedError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{combinedError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-2 sm:mt-4 flex flex-wrap justify-center gap-4 sm:gap-8 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>ATS Optimization</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Content Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Skill Gap Detection</span>
        </div>
      </div>
    </div>
  );
}
