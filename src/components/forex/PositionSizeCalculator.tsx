'use client';

import { useState, useMemo, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  X,
  DollarSign,
  Target,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PAIRS = [
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'USD/CHF',
  'AUD/USD',
  'USD/CAD',
  'NZD/USD',
  'EUR/GBP',
] as const;

/**
 * Pip value in USD per standard lot for each pair.
 * Standard pairs (quote = USD):  $10 / pip / lot
 * JPY pairs (USD/JPY):           ~$6.30 / pip / lot (at 158 rate)
 * CHF pairs (USD/CHF):           ~$11.30 / pip / lot (at 0.88 rate)
 * CAD pairs (USD/CAD):           ~$7.30 / pip / lot (at 1.36 rate)
 * Cross pairs:                   variable based on quote currency
 */
const PIP_VALUE_PER_LOT: Record<string, number> = {
  'EUR/USD': 10.0,
  'GBP/USD': 10.0,
  'AUD/USD': 10.0,
  'NZD/USD': 10.0,
  'USD/JPY': 6.30,
  'USD/CHF': 11.30,
  'USD/CAD': 7.30,
  'EUR/GBP': 11.90, // GBP/USD ≈ 1.19 → 10 * 1.19 ≈ 11.90
};

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function usePositionCalc() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, open, close } as const;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface PositionSizeCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PositionSizeCalculator({
  isOpen,
  onClose,
}: PositionSizeCalculatorProps) {
  const [balance, setBalance] = useState('10000');
  const [riskPct, setRiskPct] = useState('1');
  const [slPips, setSlPips] = useState('50');
  const [pair, setPair] = useState('EUR/USD');

  const calculation = useMemo(() => {
    const bal = parseFloat(balance);
    const risk = parseFloat(riskPct);
    const sl = parseFloat(slPips);

    if (!bal || bal <= 0 || !risk || risk <= 0 || !sl || sl <= 0) {
      return { riskAmount: null, positionLots: null, pipValue: null };
    }

    const pipVal = PIP_VALUE_PER_LOT[pair] ?? 10.0;
    const riskAmount = (bal * risk) / 100;
    const positionLots = riskAmount / (sl * pipVal);

    return { riskAmount, positionLots, pipValue: pipVal };
  }, [balance, riskPct, slPips, pair]);

  const isValid = calculation.riskAmount !== null;

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="pos-size-calc-overlay"
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-[340px] max-w-[92vw] rounded-xl glass-deep corner-bracket"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Extra corner brackets (top-right, bottom-left) for full-frame look */}
            <span className="corner-br-tr" />
            <span className="corner-br-bl" />

            <div className="relative z-10 p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Calculator
                    size={16}
                    style={{ color: 'var(--forex-accent)' }}
                  />
                  <h2
                    className="text-[13px] font-semibold tracking-wide"
                    style={{ color: 'var(--forex-text)' }}
                  >
                    Position Size Calculator
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: 'var(--forex-muted)' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3.5">
                {/* Currency Pair */}
                <div>
                  <label
                    className="block text-[11px] mb-1 uppercase tracking-widest font-medium"
                    style={{ color: 'var(--forex-muted)' }}
                  >
                    Currency Pair
                  </label>
                  <div className="relative">
                    <select
                      value={pair}
                      onChange={(e) => setPair(e.target.value)}
                      className="w-full appearance-none rounded-lg px-3 py-2.5 text-[13px] input-glass focus:outline-none pr-8 tabular-nums"
                      style={{ color: 'var(--forex-text)' }}
                    >
                      {PAIRS.map((p) => (
                        <option
                          key={p}
                          value={p}
                          className="bg-gray-900 text-white"
                        >
                          {p}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={13}
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--forex-muted)' }}
                    />
                  </div>
                </div>

                {/* Account Balance */}
                <div>
                  <label
                    className="block text-[11px] mb-1 uppercase tracking-widest font-medium"
                    style={{ color: 'var(--forex-muted)' }}
                  >
                    <span className="inline-flex items-center gap-1">
                      <DollarSign size={10} />
                      Account Balance
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="10000"
                    className="w-full rounded-lg px-3 py-2.5 text-[13px] input-glass placeholder-white/20 tabular-nums"
                    style={{ color: 'var(--forex-text)' }}
                  />
                </div>

                {/* Risk % */}
                <div>
                  <label
                    className="block text-[11px] mb-1 uppercase tracking-widest font-medium"
                    style={{ color: 'var(--forex-muted)' }}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Target size={10} />
                      Risk Percentage
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={riskPct}
                    onChange={(e) => setRiskPct(e.target.value)}
                    placeholder="1"
                    className="w-full rounded-lg px-3 py-2.5 text-[13px] input-glass placeholder-white/20 tabular-nums"
                    style={{ color: 'var(--forex-text)' }}
                  />
                </div>

                {/* Stop Loss (pips) */}
                <div>
                  <label
                    className="block text-[11px] mb-1 uppercase tracking-widest font-medium"
                    style={{ color: 'var(--forex-muted)' }}
                  >
                    <span className="inline-flex items-center gap-1">
                      <AlertTriangle size={10} />
                      Stop Loss (pips)
                    </span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={slPips}
                    onChange={(e) => setSlPips(e.target.value)}
                    placeholder="50"
                    className="w-full rounded-lg px-3 py-2.5 text-[13px] input-glass placeholder-white/20 tabular-nums"
                    style={{ color: 'var(--forex-text)' }}
                  />
                </div>

                {/* Divider */}
                <div
                  className="border-t"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                />

                {/* Results */}
                {isValid ? (
                  <div
                    className="rounded-lg p-3.5 space-y-2.5"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Position Size */}
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[11px] uppercase tracking-widest"
                        style={{ color: 'var(--forex-muted)' }}
                      >
                        Position Size
                      </span>
                      <span
                        className="text-[13px] font-bold tabular-nums"
                        style={{ color: 'var(--forex-accent)' }}
                      >
                        {calculation.positionLots!.toFixed(2)} lots
                      </span>
                    </div>

                    <div
                      className="border-t"
                      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    />

                    {/* Risk Amount */}
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[11px] uppercase tracking-widest"
                        style={{ color: 'var(--forex-muted)' }}
                      >
                        Risk Amount
                      </span>
                      <span
                        className="text-[13px] font-bold tabular-nums"
                        style={{ color: 'var(--loss)' }}
                      >
                        ${calculation.riskAmount!.toFixed(2)}
                      </span>
                    </div>

                    <div
                      className="border-t"
                      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    />

                    {/* Pip Value per Lot */}
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[11px] uppercase tracking-widest"
                        style={{ color: 'var(--forex-muted)' }}
                      >
                        Pip Value / Lot
                      </span>
                      <span
                        className="text-[13px] font-bold tabular-nums"
                        style={{ color: 'var(--gold)' }}
                      >
                        ${calculation.pipValue!.toFixed(2)}
                      </span>
                    </div>

                    {/* Mini info line */}
                    <div className="flex items-center justify-between pt-1">
                      <span
                        className="text-[10px]"
                        style={{ color: 'rgba(255,255,255,0.2)' }}
                      >
                        {pair} &middot; {parseFloat(slPips)} pips SL &middot;{' '}
                        {riskPct}% risk
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-lg p-3.5 flex items-center gap-2"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <AlertTriangle
                      size={12}
                      style={{ color: 'var(--forex-muted)' }}
                    />
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--forex-muted)' }}
                    >
                      Enter valid values to calculate
                    </span>
                  </div>
                )}

                {/* Calculate / Close button */}
                <button
                  onClick={onClose}
                  className="w-full rounded-lg px-4 py-2.5 text-[13px] font-semibold tracking-wide btn-3d liquid-shine transition-all"
                  style={{ color: 'var(--forex-text)' }}
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}