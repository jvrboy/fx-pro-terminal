'use client';

import { useState, useCallback, useSyncExternalStore, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Target,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useForexStore } from '@/lib/store';

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

type PairName = (typeof PAIRS)[number];

/** Simulated mid-prices used when no live feed is available. */
const MOCK_PRICES: Record<PairName, number> = {
  'EUR/USD': 1.0866,
  'GBP/USD': 1.2735,
  'USD/JPY': 157.24,
  'USD/CHF': 0.8824,
  'AUD/USD': 0.6543,
  'USD/CAD': 1.3646,
  'NZD/USD': 0.5979,
  'EUR/GBP': 0.8535,
};

/** Pip size per pair (JPY pairs use 0.01). */
function pipSize(pair: string): number {
  return pair.includes('JPY') ? 0.01 : 0.0001;
}

/** Pip value in USD per standard lot (1.0). */
function pipValueUSD(pair: string): number {
  return pair.includes('JPY') ? 6.37 : 10.0;
}

/** Number of decimal places to display. */
function decimals(pair: string): number {
  return pair.includes('JPY') ? 2 : 4;
}

const LOT_QUICK_BUTTONS = [0.01, 0.05, 0.1, 0.25, 0.5, 1.0] as const;

const LEVERAGE = 100;
const CONTRACT_SIZE = 100_000;

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface OrderExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pair?: string;
  direction?: 'BUY' | 'SELL';
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  timeframe?: string;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useOrderModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [props, setProps] = useState<OrderExecutionModalProps>({
    isOpen: false,
    onClose: () => setIsOpen(false),
  });

  const open = useCallback(
    (overrides?: Partial<Omit<OrderExecutionModalProps, 'isOpen' | 'onClose'>>) => {
      setProps((prev) => ({
        ...prev,
        ...overrides,
        isOpen: true,
        onClose: () => setIsOpen(false),
      }));
      setIsOpen(true);
    },
    []
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setProps((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return { isOpen, open, close, props };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OrderExecutionModal({
  isOpen,
  onClose,
  pair: initialPair,
  direction: initialDirection,
  entryPrice: initialEntry,
  stopLoss: initialSL,
  takeProfit: initialTP,
  timeframe: initialTimeframe,
}: OrderExecutionModalProps) {
  const addToast = useForexStore((s) => s.addToast);

  /* ---- state ---- */
  const isSignal = !!(initialPair && initialDirection);

  const [selectedPair, setSelectedPair] = useState<string>(initialPair ?? PAIRS[0]);
  const [direction, setDirection] = useState<'BUY' | 'SELL'>(
    initialDirection ?? 'BUY'
  );
  const [entryPrice, setEntryPrice] = useState<string>(
    initialEntry ? initialEntry.toFixed(decimals(initialPair ?? PAIRS[0])) : ''
  );
  const [lotSize, setLotSize] = useState<string>('0.1');
  const [slMode, setSlMode] = useState<'pips' | 'price'>('pips');
  const [slPips, setSlPips] = useState<string>(
    initialSL && initialEntry
      ? (Math.abs(initialSL - initialEntry) / pipSize(initialPair ?? PAIRS[0])).toFixed(1)
      : '30'
  );
  const [slPrice, setSlPrice] = useState<string>(
    initialSL ? initialSL.toFixed(decimals(initialPair ?? PAIRS[0])) : ''
  );
  const [tpMode, setTpMode] = useState<'pips' | 'price'>('pips');
  const [tpPips, setTpPips] = useState<string>(
    initialTP && initialEntry
      ? (Math.abs(initialTP - initialEntry) / pipSize(initialPair ?? PAIRS[0])).toFixed(1)
      : '60'
  );
  const [tpPrice, setTpPrice] = useState<string>(
    initialTP ? initialTP.toFixed(decimals(initialPair ?? PAIRS[0])) : ''
  );
  const [executing, setExecuting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- derived calculations ---- */
  const dec = decimals(selectedPair);
  const ps = pipSize(selectedPair);
  const pv = pipValueUSD(selectedPair);
  const currentPrice = MOCK_PRICES[selectedPair as PairName] ?? 1.0;
  const entry = parseFloat(entryPrice) || currentPrice;
  const lots = parseFloat(lotSize) || 0;

  const slDist = slMode === 'pips' ? parseFloat(slPips) || 0 : Math.abs(entry - (parseFloat(slPrice) || 0)) / ps;
  const tpDist = tpMode === 'pips' ? parseFloat(tpPips) || 0 : Math.abs((parseFloat(tpPrice) || 0) - entry) / ps;

  const riskAmount = slDist * pv * lots;
  const potentialProfit = tpDist * pv * lots;
  const rrRatio = slDist > 0 ? tpDist / slDist : 0;
  const marginRequired = (CONTRACT_SIZE * lots * entry) / LEVERAGE;

  /* ---- helpers ---- */
  const formatCurrency = (val: number) =>
    `$${val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  const isValid =
    lots > 0 && entry > 0 && (slMode === 'pips' ? slDist > 0 : parseFloat(slPrice) !== entry) && (tpMode === 'pips' ? tpDist > 0 : parseFloat(tpPrice) !== entry);

  /* ---- handlers ---- */
  const handlePairChange = useCallback(
    (newPair: string) => {
      setSelectedPair(newPair);
      const price = MOCK_PRICES[newPair as PairName] ?? 1.0;
      const d = decimals(newPair);
      if (!isSignal) {
        setEntryPrice(price.toFixed(d));
        setSlPrice('');
        setTpPrice('');
      }
    },
    [isSignal]
  );

  const handleDirectionChange = useCallback((dir: 'BUY' | 'SELL') => {
    setDirection(dir);
  }, []);

  const handleExecute = useCallback(() => {
    if (!isValid || executing) return;
    setExecuting(true);

    // Simulate execution delay
    setTimeout(() => {
      setExecuting(false);
      setConfirmed(true);

      addToast({
        message: `${direction} ${lots} lot ${selectedPair} @ ${entry.toFixed(dec)} executed successfully`,
        type: 'success',
      });

      confirmTimer.current = setTimeout(() => {
        setConfirmed(false);
        onClose();
      }, 1500);
    }, 800);
  }, [isValid, executing, direction, lots, selectedPair, entry, dec, addToast, onClose]);

  const handleClose = useCallback(() => {
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setExecuting(false);
    setConfirmed(false);
    onClose();
  }, [onClose]);

  /* ---- portal mount ---- */
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) return null;

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="order-exec-overlay"
          className="alert-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
        >
          <motion.div
            className="glass glass-deep"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              width: 'min(440px, calc(100vw - 32px))',
              maxHeight: 'min(92vh, 780px)',
              overflowY: 'auto',
              borderRadius: '16px',
              zIndex: 100,
              boxShadow: confirmed
                ? '0 0 60px rgba(34,197,94,0.3)'
                : '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Corner brackets */}
            <span className="absolute top-2 left-2 w-5 h-5 border-t border-l border-white/20 rounded-tl pointer-events-none" />
            <span className="absolute top-2 right-2 w-5 h-5 border-t border-r border-white/20 rounded-tr pointer-events-none" />
            <span className="absolute bottom-2 left-2 w-5 h-5 border-b border-l border-white/20 rounded-bl pointer-events-none" />
            <span className="absolute bottom-2 right-2 w-5 h-5 border-b border-r border-white/20 rounded-br pointer-events-none" />

            {/* Confirmation overlay */}
            <AnimatePresence>
              {confirmed && (
                <motion.div
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(5,46,22,0.85)', backdropFilter: 'blur(8px)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                  >
                    <CheckCircle2 size={56} className="text-green-400" />
                  </motion.div>
                  <motion.p
                    className="mt-3 text-green-300 font-semibold text-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Order Executed
                  </motion.p>
                  <motion.p
                    className="mt-1 text-green-400/70 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                  >
                    {direction} {lots} lot {selectedPair}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative z-10 p-5">
              {/* ---- Header ---- */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{
                      background: direction === 'BUY'
                        ? 'rgba(34,197,94,0.15)'
                        : 'rgba(239,68,68,0.15)',
                    }}
                  >
                    {direction === 'BUY' ? (
                      <TrendingUp size={16} className="text-green-400" />
                    ) : (
                      <TrendingDown size={16} className="text-red-400" />
                    )}
                  </div>
                  <div>
                    <h2
                      className="text-base font-semibold leading-tight"
                      style={{ color: 'var(--forex-text, #fff)' }}
                    >
                      Execute Trade
                    </h2>
                    {isSignal && initialTimeframe && (
                      <span
                        className="text-[10px] uppercase tracking-wider"
                        style={{ color: 'var(--forex-muted, rgba(255,255,255,0.4))' }}
                      >
                        Signal &middot; {initialTimeframe}
                      </span>
                    )}
                  </div>
                  {selectedPair && (
                    <span
                      className="ml-1 px-2 py-0.5 rounded text-xs font-bold tracking-wide"
                      style={{
                        color: direction === 'BUY' ? 'var(--profit, #22c55e)' : 'var(--loss, #ef4444)',
                        background:
                          direction === 'BUY'
                            ? 'rgba(34,197,94,0.12)'
                            : 'rgba(239,68,68,0.12)',
                        border: `1px solid ${direction === 'BUY' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                      }}
                    >
                      {selectedPair}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: 'var(--forex-muted, rgba(255,255,255,0.4))' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* ---- Pair Selector ---- */}
              <div className="mb-3.5">
                <label
                  className="block text-[11px] mb-1.5 uppercase tracking-wider font-medium"
                  style={{ color: 'var(--forex-muted, rgba(255,255,255,0.45))' }}
                >
                  Currency Pair
                </label>
                <div className="relative">
                  <select
                    value={selectedPair}
                    onChange={(e) => handlePairChange(e.target.value)}
                    className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--forex-accent)]/50 transition-colors pr-8"
                    style={{ color: 'var(--forex-text, #fff)' }}
                  >
                    {PAIRS.map((p) => (
                      <option key={p} value={p} className="bg-gray-900 text-white">
                        {p}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  />
                </div>
              </div>

              {/* ---- Direction Toggle ---- */}
              <div className="mb-3.5">
                <label
                  className="block text-[11px] mb-1.5 uppercase tracking-wider font-medium"
                  style={{ color: 'var(--forex-muted, rgba(255,255,255,0.45))' }}
                >
                  Direction
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDirectionChange('BUY')}
                    className="btn-3d relative py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all border"
                    style={
                      direction === 'BUY'
                        ? {
                            background: 'linear-gradient(135deg, rgba(34,197,94,0.25), rgba(34,197,94,0.10))',
                            borderColor: 'rgba(34,197,94,0.5)',
                            color: '#4ade80',
                            boxShadow: '0 4px 20px rgba(34,197,94,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
                          }
                        : {
                            background: 'rgba(255,255,255,0.03)',
                            borderColor: 'rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.35)',
                          }
                    }
                  >
                    <TrendingUp size={16} className="inline-block mr-1.5 -mt-0.5" />
                    Buy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectionChange('SELL')}
                    className="btn-3d relative py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all border"
                    style={
                      direction === 'SELL'
                        ? {
                            background: 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.10))',
                            borderColor: 'rgba(239,68,68,0.5)',
                            color: '#f87171',
                            boxShadow: '0 4px 20px rgba(239,68,68,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
                          }
                        : {
                            background: 'rgba(255,255,255,0.03)',
                            borderColor: 'rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.35)',
                          }
                    }
                  >
                    <TrendingDown size={16} className="inline-block mr-1.5 -mt-0.5" />
                    Sell
                  </button>
                </div>
              </div>

              {/* ---- Entry Price ---- */}
              <div className="mb-3.5">
                <label
                  className="block text-[11px] mb-1.5 uppercase tracking-wider font-medium"
                  style={{ color: 'var(--forex-muted, rgba(255,255,255,0.45))' }}
                >
                  Entry Price
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step={ps}
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    onFocus={(e) => {
                      if (!entryPrice) {
                        setEntryPrice(currentPrice.toFixed(dec));
                        setTimeout(() => e.target.select(), 0);
                      }
                    }}
                    placeholder={currentPrice.toFixed(dec)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[var(--forex-accent)]/50 transition-colors"
                    style={{ color: 'var(--forex-text, #fff)' }}
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider"
                    style={{ color: 'var(--forex-muted, rgba(255,255,255,0.3))' }}
                  >
                    Market
                  </span>
                </div>
              </div>

              {/* ---- Lot Size ---- */}
              <div className="mb-3.5">
                <label
                  className="block text-[11px] mb-1.5 uppercase tracking-wider font-medium"
                  style={{ color: 'var(--forex-muted, rgba(255,255,255,0.45))' }}
                >
                  Lot Size
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="100"
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[var(--forex-accent)]/50 transition-colors mb-2"
                  style={{ color: 'var(--forex-text, #fff)' }}
                />
                <div className="grid grid-cols-6 gap-1.5">
                  {LOT_QUICK_BUTTONS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setLotSize(String(v))}
                      className="py-1.5 rounded-md text-[11px] font-medium transition-all border"
                      style={
                        lotSize === String(v)
                          ? {
                              background: 'var(--forex-accent, rgba(99,102,241,0.15))',
                              borderColor: 'var(--forex-accent, rgba(99,102,241,0.4))',
                              color: 'var(--forex-accent, #818cf8)',
                            }
                          : {
                              background: 'rgba(255,255,255,0.03)',
                              borderColor: 'rgba(255,255,255,0.06)',
                              color: 'rgba(255,255,255,0.45)',
                            }
                      }
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* ---- Stop Loss ---- */}
              <div className="mb-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className="text-[11px] uppercase tracking-wider font-medium"
                    style={{ color: 'var(--forex-muted, rgba(255,255,255,0.45))' }}
                  >
                    <Shield size={11} className="inline-block mr-1 -mt-px" />
                    Stop Loss
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setSlMode('pips')}
                      className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium transition-all"
                      style={
                        slMode === 'pips'
                          ? { background: 'rgba(239,68,68,0.15)', color: '#f87171' }
                          : { color: 'rgba(255,255,255,0.3)' }
                      }
                    >
                      Pips
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlMode('price')}
                      className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium transition-all"
                      style={
                        slMode === 'price'
                          ? { background: 'rgba(239,68,68,0.15)', color: '#f87171' }
                          : { color: 'rgba(255,255,255,0.3)' }
                      }
                    >
                      Price
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  step={slMode === 'pips' ? '0.5' : ps}
                  value={slMode === 'pips' ? slPips : slPrice}
                  onChange={(e) =>
                    slMode === 'pips' ? setSlPips(e.target.value) : setSlPrice(e.target.value)
                  }
                  placeholder={slMode === 'pips' ? '30' : entry.toFixed(dec)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-500/50 transition-colors mb-2"
                  style={{ color: 'var(--forex-text, #fff)' }}
                />
                {/* Quick slider for SL pips */}
                {slMode === 'pips' && (
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] shrink-0"
                      style={{ color: 'var(--forex-muted, rgba(255,255,255,0.3))' }}
                    >
                      10
                    </span>
                    <input
                      type="range"
                      min="5"
                      max="200"
                      step="5"
                      value={parseFloat(slPips) || 30}
                      onChange={(e) => setSlPips(e.target.value)}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, rgba(239,68,68,0.6) ${(parseFloat(slPips) || 30) / 2}%, rgba(255,255,255,0.08) ${(parseFloat(slPips) || 30) / 2}%)`,
                        accentColor: '#ef4444',
                      }}
                    />
                    <span
                      className="text-[10px] shrink-0"
                      style={{ color: 'var(--forex-muted, rgba(255,255,255,0.3))' }}
                    >
                      200
                    </span>
                  </div>
                )}
              </div>

              {/* ---- Take Profit ---- */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className="text-[11px] uppercase tracking-wider font-medium"
                    style={{ color: 'var(--forex-muted, rgba(255,255,255,0.45))' }}
                  >
                    <Target size={11} className="inline-block mr-1 -mt-px" />
                    Take Profit
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setTpMode('pips')}
                      className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium transition-all"
                      style={
                        tpMode === 'pips'
                          ? { background: 'rgba(34,197,94,0.15)', color: '#4ade80' }
                          : { color: 'rgba(255,255,255,0.3)' }
                      }
                    >
                      Pips
                    </button>
                    <button
                      type="button"
                      onClick={() => setTpMode('price')}
                      className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium transition-all"
                      style={
                        tpMode === 'price'
                          ? { background: 'rgba(34,197,94,0.15)', color: '#4ade80' }
                          : { color: 'rgba(255,255,255,0.3)' }
                      }
                    >
                      Price
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  step={tpMode === 'pips' ? '0.5' : ps}
                  value={tpMode === 'pips' ? tpPips : tpPrice}
                  onChange={(e) =>
                    tpMode === 'pips' ? setTpPips(e.target.value) : setTpPrice(e.target.value)
                  }
                  placeholder={tpMode === 'pips' ? '60' : entry.toFixed(dec)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-green-500/50 transition-colors"
                  style={{ color: 'var(--forex-text, #fff)' }}
                />
              </div>

              {/* ---- Risk Calculator Box ---- */}
              <div className="glass-subtle card-depth-1 rounded-xl p-3.5 mb-3.5">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <AlertTriangle
                    size={12}
                    style={{ color: 'var(--gold, #f59e0b)' }}
                  />
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--gold, #f59e0b)' }}
                  >
                    Risk Calculator
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="mini-stat">
                    <div className="mini-stat-label">Risk ($)</div>
                    <div
                      className="mini-stat-value text-sm"
                      style={{ color: 'var(--loss, #ef4444)' }}
                    >
                      {formatCurrency(riskAmount)}
                    </div>
                  </div>
                  <div className="mini-stat">
                    <div className="mini-stat-label">Pip Value</div>
                    <div className="mini-stat-value text-sm" style={{ color: 'var(--forex-text, #fff)' }}>
                      {(pv * lots).toFixed(2)}
                    </div>
                  </div>
                  <div className="mini-stat">
                    <div className="mini-stat-label">R : R</div>
                    <div
                      className="mini-stat-value text-sm font-bold"
                      style={{
                        color:
                          rrRatio >= 2
                            ? 'var(--profit, #22c55e)'
                            : rrRatio >= 1
                              ? 'var(--gold, #f59e0b)'
                              : 'var(--loss, #ef4444)',
                      }}
                    >
                      1 : {rrRatio > 0 ? rrRatio.toFixed(1) : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* ---- Summary Card ---- */}
              <div className="glass-subtle card-depth-1 rounded-xl p-3.5 mb-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Info size={12} style={{ color: 'var(--forex-accent, #818cf8)' }} />
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--forex-accent, #818cf8)' }}
                  >
                    Order Summary
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="mini-stat">
                    <div className="mini-stat-label">Total Risk</div>
                    <div className="mini-stat-value text-sm" style={{ color: 'var(--loss, #ef4444)' }}>
                      {formatCurrency(riskAmount)}
                    </div>
                  </div>
                  <div className="mini-stat">
                    <div className="mini-stat-label">Potential Profit</div>
                    <div className="mini-stat-value text-sm" style={{ color: 'var(--profit, #22c55e)' }}>
                      {formatCurrency(potentialProfit)}
                    </div>
                  </div>
                  <div className="mini-stat">
                    <div className="mini-stat-label">Potential Loss</div>
                    <div className="mini-stat-value text-sm" style={{ color: 'var(--loss, #ef4444)' }}>
                      {formatCurrency(riskAmount)}
                    </div>
                  </div>
                  <div className="mini-stat">
                    <div className="mini-stat-label">Margin Required</div>
                    <div className="mini-stat-value text-sm" style={{ color: 'var(--gold, #f59e0b)' }}>
                      {formatCurrency(marginRequired)}
                    </div>
                  </div>
                </div>
              </div>

              {/* ---- Execute Button ---- */}
              <motion.button
                type="button"
                onClick={handleExecute}
                disabled={!isValid || executing || confirmed}
                className="btn-3d w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all relative overflow-hidden"
                style={
                  direction === 'BUY'
                    ? {
                        background: executing
                          ? 'rgba(34,197,94,0.3)'
                          : confirmed
                            ? 'rgba(34,197,94,0.5)'
                            : 'linear-gradient(135deg, #16a34a, #22c55e)',
                        color: '#fff',
                        boxShadow: confirmed
                          ? '0 0 30px rgba(34,197,94,0.4)'
                          : '0 4px 24px rgba(34,197,94,0.3)',
                        cursor: !isValid || executing || confirmed ? 'not-allowed' : 'pointer',
                        opacity: !isValid ? 0.4 : 1,
                      }
                    : {
                        background: executing
                          ? 'rgba(239,68,68,0.3)'
                          : confirmed
                            ? 'rgba(239,68,68,0.5)'
                            : 'linear-gradient(135deg, #dc2626, #ef4444)',
                        color: '#fff',
                        boxShadow: confirmed
                          ? '0 0 30px rgba(239,68,68,0.4)'
                          : '0 4px 24px rgba(239,68,68,0.3)',
                        cursor: !isValid || executing || confirmed ? 'not-allowed' : 'pointer',
                        opacity: !isValid ? 0.4 : 1,
                      }
                }
                whileTap={isValid && !executing ? { scale: 0.97 } : undefined}
              >
                {executing ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                    Executing…
                  </span>
                ) : confirmed ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} />
                    Confirmed
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Zap size={16} />
                    Execute {direction} &mdash; {lots} lot {selectedPair}
                  </span>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}