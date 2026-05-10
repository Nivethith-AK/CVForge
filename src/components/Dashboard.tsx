import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import type { ResumeAnalysis } from '@/src/types/resume';
import { jsPDF } from 'jspdf';
import {
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Target,
  Briefcase,
  FileText,
  RotateCcw,
  Copy,
  Download,
  PencilLine,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { Separator } from '@/src/components/ui/separator';

interface DashboardProps {
  analysis: ResumeAnalysis;
  onReset: () => void;
}

export function Dashboard({ analysis, onReset }: DashboardProps) {
  const [editableResume, setEditableResume] = useState(analysis.tailoredResume);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [editableResume]);

  useEffect(() => {
    setEditableResume(analysis.tailoredResume);
    setCopyMessage(null);
  }, [analysis.tailoredResume]);

  const radius = 15.9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (analysis.atsScore / 100) * circumference;

  const sectionTitles = new Set([
    'FULL NAME',
    'Contact Information',
    'Professional Summary',
    'Core Skills',
    'Professional Experience',
    'Education',
    'Certifications',
    'Certifications / Training',
    'Languages',
    'Additional Information',
    'Core Strengths',
    'Resume Focus Areas',
    'Recommended Target Roles',
    'Suggested Skills to Add If Accurate',
  ]);

  const isSectionTitle = (line: string) => sectionTitles.has(line.trim());

  const downloadResumePdf = () => {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    const lineHeight = 16;
    const sectionGap = 12;
    const bulletIndent = 12;

    let cursorY = margin;

    const ensureSpace = (heightNeeded: number) => {
      if (cursorY + heightNeeded > pageHeight - margin) {
        pdf.addPage();
        cursorY = margin;
      }
    };

    const drawWrappedText = (text: string, options?: { bold?: boolean; size?: number; color?: [number, number, number]; indent?: number }) => {
      const size = options?.size ?? 11;
      const indent = options?.indent ?? 0;
      pdf.setFont('helvetica', options?.bold ? 'bold' : 'normal');
      pdf.setFontSize(size);
      pdf.setTextColor(...(options?.color ?? [30, 41, 59]));

      const wrappedLines = pdf.splitTextToSize(text, contentWidth - indent);
      ensureSpace(wrappedLines.length * lineHeight);
      pdf.text(wrappedLines, margin + indent, cursorY);
      cursorY += wrappedLines.length * lineHeight;
    };

    const lines = editableResume.split(/\r?\n/);
    let renderedName = false;

    lines.forEach((rawLine) => {
      const line = rawLine.trim();

      if (!line) {
        cursorY += 8;
        return;
      }

      if (!renderedName && !isSectionTitle(line) && !line.startsWith('-') && !line.startsWith('•')) {
        drawWrappedText(line, { bold: true, size: 18, color: [15, 23, 42] });
        cursorY += 4;
        renderedName = true;
        return;
      }

      if (isSectionTitle(line)) {
        cursorY += sectionGap;
        drawWrappedText(line.toUpperCase(), { bold: true, size: 12, color: [14, 116, 144] });
        cursorY += 2;
        return;
      }

      if (line.startsWith('-') || line.startsWith('•')) {
        drawWrappedText(`• ${line.replace(/^[-•]\s*/, '')}`, { size: 11, color: [30, 41, 59], indent: bulletIndent });
        return;
      }

      if (line.includes('|') || line.includes('@') || line.match(/^\+?[\d\s()-]+$/)) {
        drawWrappedText(line, { size: 10, color: [71, 85, 105] });
        return;
      }

      drawWrappedText(line, { size: 11, color: [30, 41, 59] });
    });

    const pdfBlob = pdf.output('blob');
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = 'tailored-resume.pdf';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  const handleCopyDraft = async () => {
    await navigator.clipboard.writeText(editableResume);
    setCopyMessage('Draft copied to clipboard');
    window.setTimeout(() => setCopyMessage(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-7xl mx-auto pb-12 pt-4"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 px-2 gap-4">
        <div>
          <motion.div 
            initial={{opacity:0, y:-10}} 
            animate={{opacity:1,y:0}} 
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 mb-3 text-cyan-600 dark:text-cyan-400 font-bold tracking-widest text-xs uppercase"
          >
            <Sparkles className="w-4 h-4" /> Analysis Complete
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Resume Intelligence
          </h2>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 group"
        >
          <RotateCcw className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
          New Scan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 w-full">
        {/* Left Column: ATS Score & Summaries */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 backdrop-blur-2xl rounded-3xl p-5 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest w-full text-center mb-6">Match Score</h3>
            
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]" viewBox="0 0 36 36">
                <defs>
                  <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
                <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="2.5"></circle>
                <motion.circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="url(#score-gradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: `${circumference} ${circumference}`, strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 2, ease: 'easeOut', delay: 0.3 }}
                ></motion.circle>
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tighter">
                  {analysis.atsScore}
                </span>
              </div>
            </div>
          </motion.div>

          <Card delay={0.2} icon={FileText} title="Executive Summary" iconColor="from-blue-500 to-cyan-400">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{analysis.summary}</p>
          </Card>

          <Card delay={0.3} icon={Briefcase} title="Recommended Roles" iconColor="from-purple-500 to-indigo-500">
            <div className="flex flex-wrap gap-2">
              {analysis.recommendedRoles.map((role, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest shadow-sm"
                >
                  {role}
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
            <Card delay={0.4} icon={CheckCircle} title="Key Strengths" iconColor="from-emerald-400 to-teal-500">
              <ScrollArea className="h-48 pr-4 -mr-4">
                <ul className="space-y-4">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-3 group/item">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform">
                        <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{strength}</p>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </Card>

            <Card delay={0.5} icon={AlertTriangle} title="Improvement Areas" iconColor="from-amber-400 to-orange-500">
              <ScrollArea className="h-48 pr-4 -mr-4">
                <ul className="space-y-4">
                  {analysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start gap-3 group/item">
                      <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform">
                        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{weakness}</p>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </Card>

            <Card delay={0.6} icon={Target} title="Missing Skills" iconColor="from-rose-400 to-red-500" className="col-span-1 md:col-span-2">
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl p-4">
                  <p className="text-sm text-red-800 dark:text-red-200 leading-relaxed font-medium">
                    These technical or soft skills are commonly found in your target roles but are missing from your resume. Adding genuine experience in these areas will boost your ATS match rate.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {analysis.missingSkills.map((skill, index) => (
                    <span key={index} className="px-4 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="md:col-span-2 relative group bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800/50 dark:to-indigo-900/20 border border-blue-100 dark:border-indigo-500/20 rounded-3xl p-5 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
              <h2 className="text-lg font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-xl">
                  <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                Actionable Next Steps
              </h2>
              <ScrollArea className="h-64 pr-4 -mr-4">
                <ul className="space-y-6 pt-2">
                  {analysis.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 text-sm font-black shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium pt-1">{improvement}</p>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </motion.div>
          </div>
        </div>

        {/* Bottom Full Width: The Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="col-span-1 lg:col-span-12 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden group/editor"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 opacity-50 group-hover/editor:opacity-100 transition-opacity"></div>
          
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <PencilLine className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                Tailored Resume Draft
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                Our AI has automatically formatted your experience. Edit freely, then export.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {copyMessage && (
                <motion.span 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl"
                >
                  {copyMessage}
                </motion.span>
              )}
              <motion.button
                type="button"
                onClick={handleCopyDraft}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-semibold text-slate-900 dark:text-white transition-all shadow-sm"
              >
                <Copy className="w-4 h-4" />
                Copy Text
              </motion.button>
              <motion.button
                type="button"
                onClick={downloadResumePdf}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-sm font-semibold text-white transition-all shadow-lg shadow-blue-500/25"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </motion.button>
            </div>
          </div>

          <Separator className="mb-6" />

          <ScrollArea className="h-[32rem] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
            <textarea
              ref={textareaRef}
              value={editableResume}
              onChange={(event) => setEditableResume(event.target.value)}
              className="w-full bg-transparent text-slate-900 dark:text-slate-200 text-[13px] leading-relaxed font-mono p-4 sm:p-6 outline-none resize-none overflow-hidden"
              spellCheck={false}
            />
          </ScrollArea>
        </motion.div>
      </div>
    </motion.div>
  );
}

function Card({
  children,
  title,
  icon: Icon,
  delay = 0,
  className,
  iconColor,
}: {
  children: React.ReactNode;
  title: string;
  icon: any;
  delay?: number;
  className?: string;
  iconColor?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className={cn(
        'relative group bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 backdrop-blur-xl rounded-3xl p-5 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />
      
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3 relative z-10">
        <div className={cn("p-2.5 rounded-2xl bg-gradient-to-br shadow-inner", iconColor)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {title}
      </h3>
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
