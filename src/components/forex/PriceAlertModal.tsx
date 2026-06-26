'use client';

import { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Bell } from 'lucide-react';
import { useForexStore } from '@/lib/store';

const PAIRS = [
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'USD/CHF',
  'AUD/USD',
  'USD/CAD',
  'NZD/USD',
  'EUR/GBP',
];

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  pair?: string;
}

export default function PriceAlertModal({ isOpen, onClose, pair }: PriceAlertModalProps) {
  const addToast = useForexStore((s) => s.addToast);

  const [selectedPair, setSelectedPair] = useState(pair ?? PAIRS[0]);
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || Number(price) <= 0) return;

    addToast({
      message: `Price alert set: ${selectedPair} ${condition.toUpperCase()} ${Number(price).toFixed(4)}`,
      type: 'success',
    });

    // Reset form
    setPrice('');
    setNotes('');
    setCondition('above');
    onClose();
  };

  const handleCancel = () => {
    setPrice('');
    setNotes('');
    setCondition('above');
    onClose();
  };

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        /* Overlay with Sheet nested inside */
        <motion.div
          key="alert-overlay"
          className="alert-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleCancel}
        >
          {/* Sheet - stopPropagation to prevent closing when clicking inside */}
          <motion.div
            className="alert-modal-sheet glass glass-deep"
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Corner brackets decoration */}
            <span className="absolute top-2 left-2 w-4 h-4 border-t border-l border-white/20 rounded-tl-sm pointer-events-none" />
            <span className="absolute top-2 right-2 w-4 h-4 border-t border-r border-white/20 rounded-tr-sm pointer-events-none" />
            <span className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-white/20 rounded-bl-sm pointer-events-none" />
            <span className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-white/20 rounded-br-sm pointer-events-none" />

            <div className="relative z-10 p-5">
              {/* Header */}
              <div className="flex items-center gap-2 mb-5">
                <Bell size={18} className="text-amber-400" />
                <h2 className="text-base font-semibold text-white">Set Price Alert</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Currency Pair Dropdown */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                    Currency Pair
                  </label>
                  <div className="relative">
                    <select
                      value={selectedPair}
                      onChange={(e) => setSelectedPair(e.target.value)}
                      className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors pr-8"
                    >
                      {PAIRS.map((p) => (
                        <option key={p} value={p} className="bg-gray-900 text-white">
                          {p}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                  </div>
                </div>

                {/* Condition Toggle */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                    Condition
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCondition('above')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${
                        condition === 'above'
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                          : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70'
                      }`}
                    >
                      Above
                    </button>
                    <button
                      type="button"
                      onClick={() => setCondition('below')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${
                        condition === 'below'
                          ? 'bg-red-500/15 border-red-500/40 text-red-400'
                          : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70'
                      }`}
                    >
                      Below
                    </button>
                  </div>
                </div>

                {/* Price Input */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                    Price
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.0000"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

                {/* Notes Input */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                    Notes <span className="text-white/30 normal-case">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add a note..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!price || Number(price) <= 0}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold btn-3d-press bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Set Alert
                  </button>
                </div>
              </form>
            </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}