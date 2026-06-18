/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface CustomToastProps {
  toasts: ToastMessage[];
  setToasts: React.Dispatch<React.SetStateAction<ToastMessage[]>>;
}

export default function CustomToast({ toasts, setToasts }: CustomToastProps) {
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
            className={`flex items-start gap-3 p-4 rounded-xl border bg-glassmorphism shadow-2xl relative overflow-hidden`}
            style={{
              borderColor:
                toast.type === 'success'
                  ? 'rgba(236,72,153,0.4)'
                  : toast.type === 'error'
                  ? 'rgba(239,68,68,0.4)'
                  : 'rgba(6,182,212,0.4)',
            }}
          >
            {/* Top flashing line for neon feedback */}
            <div
              className={`absolute top-0 left-0 right-0 h-[3px] ${
                toast.type === 'success'
                  ? 'bg-pink-500 shadow-[0_0_10px_#ec4899]'
                  : toast.type === 'error'
                  ? 'bg-red-500 shadow-[0_0_10px_#ef4444]'
                  : 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]'
              }`}
            />

            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-pink-500" />}
              {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-cyan-500" />}
            </div>

            <div className="flex-1 text-sm font-medium text-gray-200 pr-4">
              {toast.text}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white shrink-0 absolute top-3 right-3"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
