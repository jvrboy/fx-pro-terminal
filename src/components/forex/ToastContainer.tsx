'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useMediaQuery } from '@reactuses/core';
import { useForexStore } from '@/lib/store';

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const typeClassMap = {
  success: 'toast-success',
  error: 'toast-error',
  info: 'toast-info',
};

export default function ToastContainer() {
  const toasts = useForexStore((s) => s.toasts);
  const removeToast = useForexStore((s) => s.removeToast);

  const handleDismiss = useCallback(
    (id: string) => {
      removeToast(id);
    },
    [removeToast],
  );

  return (
    <div className="toast-container">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={handleDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: { id: string; message: string; type: 'success' | 'error' | 'info'; duration?: number };
  onDismiss: (id: string) => void;
}) {
  const duration = toast.duration ?? 3000;
  const isMobile = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  const Icon = iconMap[toast.type];

  const initial = isMobile
    ? { opacity: 0, y: 60, x: 0 }
    : { opacity: 0, x: 80, y: 0 };

  const exit = isMobile
    ? { opacity: 0, y: 60, scale: 0.95 }
    : { opacity: 0, x: 80, scale: 0.95 };

  return (
    <motion.div
      layout
      initial={initial}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={exit}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`toast-item ${typeClassMap[toast.type]}`}
    >
      <Icon size={18} className="shrink-0" />
      <span className="flex-1 text-sm leading-snug">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 ml-2 p-0.5 rounded opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}