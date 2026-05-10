import { motion } from 'motion/react';

interface AnimatedCounterProps {
  value: number;
  max?: number;
}

export function AnimatedCounter({ value, max = 100 }: AnimatedCounterProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-xs text-slate-400 text-right font-semibold"
    >
      <span>
        {Math.round(value)}%
      </span>
    </motion.div>
  );
}
