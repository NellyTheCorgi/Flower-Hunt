import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icons } from '../constants';

interface ErrorToastProps {
  message: string;
  onClose: () => void;
}

export function ErrorToast({ message, onClose }: ErrorToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        className="fixed bottom-24 left-6 right-6 z-[100] flex justify-center pointer-events-none"
      >
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md pointer-events-auto">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Icons.X className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-sm font-medium leading-relaxed">{message}</p>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-100 rounded-full transition-colors ml-2"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
