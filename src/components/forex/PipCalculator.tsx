'use client';

import { useState, useMemo, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calculator, ChevronDown } from 'lucide-react';

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

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];

const PAIR_RATES: Record<string, number> = {
  'EUR/USD': 1.0865,
  'GBP/USD': 1.2720,
  'USD/JPY': 149.50,
  'USD/CHF': 0.8830,
  'AUD/USD': 0.6545,
  'USD/CAD': 1.3620,
  'NZD/USD': 0.6125,
  'EUR/GBP': 0.8540,
};

const USD_CONVERSION: Record<string, number> = {
  USD: 1,
  EUR: 1 / 1.0865,
  GBP: 1 / 1.2720,
  JPY: 1 / 149.50,
  AUD: 1 / 0.6545,
  CAD: 1 / 1.3620,
  CHF: 1 / 0.8830,
  NZD: 1 / 0.6125,
};

function getPipValuePerLotUSD(pair: string): number {
  const rate = PAIR_RATES[pair] ?? 1.0;
  const isJPY = pair.includes('JPY');
  const pipSize = isJPY ? 0.01 : 0.0001;
  const lotSize = 100000;

  // USD is quote currency (pair ends in /USD, except USD/xxx)
  if (pair.endsWith('/USD')) {
    return pipSize * lotSize;
  }

  // USD is base currency (pair starts with USD/)
  if (pair.startsWith('USD/')) {
    return (pipSize / rate) * lotSize;
  }

  // Cross pair: pip value in quote currency, then convert to USD
  const quoteCurrency = pair.split('/')[1];
  const pipInQuote = pipSize * lotSize;

  if (quoteCurrency === 'GBP') return pipInQuote * PAIR_RATES['GBP/USD'];
  if (quoteCurrency === 'JPY') return pipInQuote / PAIR_RATES['USD/JPY'];
  if (quoteCurrency === 'CHF') return pipInQuote / PAIR_RATES['USD/CHF'];
  if (quoteCurrency === 'CAD') return pipInQuote / PAIR_RATES['USD/CAD'];
  if (quoteCurrency === 'AUD') return pipInQuote / PAIR_RATES['AUD/USD'];
  if (quoteCurrency === 'NZD') return pipInQuote / PAIR_RATES['NZD/USD'];

  return 10;
}

interface PipCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PipCalculator({ isOpen, onClose }: PipCalculatorProps) {
  const [accountCurrency, setAccountCurrency] = useState('USD');
  const [pair, setPair] = useState('EUR/USD');
  const [accountSize, setAccountSize] = useState('10000');
  const [slPips, setSlPips] = useState('50');

  const calculation = useMemo(() => {
    const size = parseFloat(accountSize);
    const sl = parseFloat(slPips);

    if (!size || size <= 0 || !sl || sl <= 0) {
      return { pipValue: null, pos1Pct: null, pos2Pct: null };
    }

    const pipValUSD = getPipValuePerLotUSD(pair);
    const conversionRate = USD_CONVERSION[accountCurrency] ?? 1;
    const pipValue = pipValUSD * conversionRate;

    const risk1Pct = size * 0.01;
    const risk2Pct = size * 0.02;
    const pos1Pct = risk1Pct / (sl * pipValue);
    const pos2Pct = risk2Pct / (sl * pipValue);

    return { pipValue, pos1Pct, pos2Pct };
  }, [accountCurrency, pair, accountSize, slPips]);

  const isValid = calculation.pipValue !== null;

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) return null;

  const isJPY = pair.includes('JPY');
  const pipSize = isJPY ? 0.01 : 0.0001;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="pip-calc-overlay"
          className="pip-calc-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="pip-calc-sheet glass glass-deep"
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
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <Calculator size={18} style={{ color: 'var(--forex-accent)' }} />
                  <h2
                    className="text-base font-semibold"
                    style={{ color: 'var(--forex-text)' }}
                  >
                    Pip Calculator
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: 'var(--forex-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Account Currency */}
                <div>
                  <label
                    className="block text-xs mb-1.5 uppercase tracking-wider"
                    style={{ color: 'var(--forex-muted)' }}
                  >
                    Account Currency
                  </label>
                  <div className="relative">
                    <select
                      value={accountCurrency}
                      onChange={(e) => setAccountCurrency(e.target.value)}
                      className="w-full appearance-none rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors pr-8"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--forex-text)',
                      }}
                    >
                      {CURRENCIES.map((c) => (
                        <option
                          key={c}
                          value={c}
                          className="bg-gray-900 text-white"
                        >
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--forex-muted)' }}
                    />
                  </div>
                </div>

                {/* Pair */}
                <div>
                  <label
                    className="block text-xs mb-1.5 uppercase tracking-wider"
                    style={{ color: 'var(--forex-muted)' }}
                  >
                    Currency Pair
                  </label>
                  <div className="relative">
                    <select
                      value={pair}
                      onChange={(e) => setPair(e.target.value)}
                      className="w-full appearance-none rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors pr-8"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--forex-text)',
                      }}
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
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--forex-muted)' }}
                    />
                  </div>
                </div>

                {/* Account Size */}
                <div>
                  <label
                    className="block text-xs mb-1.5 uppercase tracking-wider"
                    style={{ color: 'var(--forex-muted)' }}
                  >
                    Account Size ({accountCurrency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={accountSize}
                    onChange={(e) => setAccountSize(e.target.value)}
                    placeholder="10000"
                    className="w-full rounded-lg px-3 py-2.5 text-sm placeholder-white/20 focus:outline-none transition-colors tabular-nums"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--forex-text)',
                    }}
                  />
                </div>

                {/* Stop Loss (pips) */}
                <div>
                  <label
                    className="block text-xs mb-1.5 uppercase tracking-wider"
                    style={{ color: 'var(--forex-muted)' }}
                  >
                    Stop Loss (pips)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={slPips}
                    onChange={(e) => setSlPips(e.target.value)}
                    placeholder="50"
                    className="w-full rounded-lg px-3 py-2.5 text-sm placeholder-white/20 focus:outline-none transition-colors tabular-nums"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--forex-text)',
                    }}
                  />
                </div>

                {/* Results */}
                {isValid && (
                  <div
                    className="rounded-lg p-4 space-y-3"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Pip Value */}
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs uppercase tracking-wider"
                        style={{ color: 'var(--forex-muted)' }}
                      >
                        Pip Value (1 lot)
                      </span>
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color: 'var(--forex-accent)' }}
                      >
                        {accountCurrency}{' '}
                        {calculation.pipValue!.toFixed(2)}
                      </span>
                    </div>

                    <div
                      className="border-t"
                      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    />

                    {/* Position Size 1% */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span
                          className="text-xs uppercase tracking-wider block"
                          style={{ color: 'var(--forex-muted)' }}
                        >
                          Position Size
                        </span>
                        <span
                          className="text-[10px]"
                          style={{ color: 'rgba(255,255,255,0.25)' }}
                        >
                          for 1% risk ({parseFloat(slPips)} pips SL)
                        </span>
                      </div>
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color: 'var(--profit)' }}
                      >
                        {calculation.pos1Pct!.toFixed(2)} lots
                      </span>
                    </div>

                    <div
                      className="border-t"
                      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    />

                    {/* Position Size 2% */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span
                          className="text-xs uppercase tracking-wider block"
                          style={{ color: 'var(--forex-muted)' }}
                        >
                          Position Size
                        </span>
                        <span
                          className="text-[10px]"
                          style={{ color: 'rgba(255,255,255,0.25)' }}
                        >
                          for 2% risk ({parseFloat(slPips)} pips SL)
                        </span>
                      </div>
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color: 'var(--gold)' }}
                      >
                        {calculation.pos2Pct!.toFixed(2)} lots
                      </span>
                    </div>

                    {/* Pip info */}
                    <div
                      className="border-t"
                      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    />
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px]"
                        style={{ color: 'rgba(255,255,255,0.2)' }}
                      >
                        1 pip = {pipSize}
                        {isJPY ? ' (JPY pair)' : ' (standard pair)'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}