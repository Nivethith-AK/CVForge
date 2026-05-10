import React, { useEffect, useState } from 'react';
import { Target, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

interface NavbarProps {
  onHomeClick?: () => void;
}

export function Navbar({ onHomeClick }: NavbarProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const isDarkMode = localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && document.documentElement.classList.contains('dark'));
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

    <nav className="h-[64px] border-b border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-xl flex items-center justify-between px-4 sm:px-8 relative z-10 w-full transition-colors duration-300">
      <motion.button 
        onClick={onHomeClick}
        className="flex items-center gap-2 outline-none cursor-pointer"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div 
          className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center"
          whileHover={{ rotate: 180, scale: 1.1 }}
          transition={{ duration: 0.6 }}
        >
          <Target className="w-5 h-5 text-white" />
        </motion.div>
        <motion.span 
          className="font-bold text-xl tracking-tight text-slate-900 dark:text-white transition-colors duration-300 hidden sm:block"
          whileHover={{ scale: 1.05 }}
        >
          CVForge
        </motion.span>
      </motion.button>
      <motion.div 
        className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-400"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <motion.button 
          onClick={toggleTheme}
          className="p-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 rounded-full text-slate-900 dark:text-white transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </motion.button>
        <motion.button 
          className="px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 rounded-full text-slate-900 dark:text-white transition-colors text-xs tracking-wide hidden sm:block"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Free Tool
        </motion.button>
      </motion.div>
    </nav>
  );
}

