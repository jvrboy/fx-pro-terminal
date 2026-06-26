'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ChevronUp,
  ChevronDown,
  Star,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Calculator,
  DollarSign,
  Copy,
  Bell,
  Play,
  Shield,
  ShieldCheck,
  Target,
  Newspaper,
  Layers,
  Clock,
  Crosshair,
  AlertTriangle,
  ChevronRight,
  Timer,
  Activity,
} from 'lucide-react';
import type { TradingSignal, MarketPair } from '@/types/forex';
import LiquidGlass from './LiquidGlass';
import MiniCandlestickChart from './MiniCandlestick';
import PriceAlertModal from './PriceAlertModal';
import { OrderExecutionModal, useOrderModal } from './OrderExecutionModal';
import { useForexStore } from '@/lib/store';

const basePairs: MarketPair[] = [
  { pair: 'EUR/USD', bid: 1.0865, ask: 1.0867, spread: 0.2, change: 0.0012, changePercent: 0.11, high: 1.0892, low: 1.0834 },
  { pair: 'GBP/USD', bid: 1.2734, ask: 1.2736, spread: 0.2, change: -0.0008, changePercent: -0.06, high: 1.2758, low: 1.2719 },
  { pair: 'USD/JPY', bid: 157.23, ask: 157.25, spread: 0.2, change: 0.45, changePercent: 0.29, high: 157.68, low: 156.82 },
  { pair: 'USD/CHF', bid: 0.8823, ask: 0.8825, spread: 0.2, change: -0.0015, changePercent: -0.17, high: 0.8851, low: 0.8809 },
  { pair: 'AUD/USD', bid: 0.6542, ask: 0.6544, spread: 0.2, change: 0.0006, changePercent: 0.09, high: 0.6568, low: 0.6527 },
  { pair: 'USD/CAD', bid: 1.3645, ask: 1.3647, spread: 0.2, change: -0.0012, changePercent: -0.09, high: 1.3672, low: 1.3628 },
  { pair: 'NZD/USD', bid: 0.5978, ask: 0.5980, spread: 0.2, change: 0.0004, changePercent: 0.07, high: 0.6001, low: 0.5962 },
  { pair: 'EUR/GBP', bid: 0.8534, ask: 0.8536, spread: 0.2, change: 0.0018, changePercent: 0.21, high: 0.8556, low: 0.8512 },
];

const signals: TradingSignal[] = [
  {
    id: 's1', userId: 'a1', username: 'MarketAnalyst', avatar: null,
    pair: 'EUR/USD', direction: 'BUY', entryPrice: 1.0865, stopLoss: 1.0835,
    takeProfit: 1.0920, timeframe: 'H1', status: 'active', confidence: 85,
    analysis: 'Ascending triangle breakout confirmed on H1. Strong volume support above 1.0860 resistance. RSI showing bullish momentum with room to run before overbought.',
    createdAt: new Date(Date.now() - 1800000).toISOString(), updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 's2', userId: 'a2', username: 'FXHunter', avatar: null,
    pair: 'GBP/USD', direction: 'SELL', entryPrice: 1.2734, stopLoss: 1.2770,
    takeProfit: 1.2680, timeframe: 'H4', status: 'active', confidence: 72,
    analysis: 'Bearish divergence on RSI. Price rejected from 1.2760 resistance level. MACD confirming downside momentum.',
    createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 's3', userId: 'a3', username: 'CurrencyKing', avatar: null,
    pair: 'USD/JPY', direction: 'BUY', entryPrice: 157.23, stopLoss: 156.80,
    takeProfit: 158.00, timeframe: 'D1', status: 'active', confidence: 78,
    analysis: 'BOJ dovish stance supporting yen weakness. Daily chart shows higher lows pattern with expanding volume on up-days.',
    createdAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 's4', userId: 'a1', username: 'MarketAnalyst', avatar: null,
    pair: 'AUD/USD', direction: 'BUY', entryPrice: 0.6542, stopLoss: 0.6515,
    takeProfit: 0.6590, timeframe: 'M15', status: 'active', confidence: 65,
    analysis: 'Intraday bounce off 0.6520 support. Momentum shifting bullish on short-term timeframes. Gold correlation supporting upside.',
    createdAt: new Date(Date.now() - 900000).toISOString(), updatedAt: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 's5', userId: 'a2', username: 'FXHunter', avatar: null,
    pair: 'USD/CAD', direction: 'SELL', entryPrice: 1.3645, stopLoss: 1.3680,
    takeProfit: 1.3590, timeframe: 'H1', status: 'active', confidence: 70,
    analysis: 'Double top formation at 1.3670 resistance. MACD bearish crossover confirms downside momentum. Oil inventory data supporting CAD strength.',
    createdAt: new Date(Date.now() - 5400000).toISOString(), updatedAt: new Date(Date.now() - 5400000).toISOString(),
  },
];

function formatPrice(price: number, pair: string) {
  const decimals = pair.includes('JPY') ? 2 : 4;
  return price.toFixed(decimals);
}

// ── Strategy types ────────────────────────────────────
interface StrategyInstrument {
  pair: string;
  winRate: number;
  profitFactor?: number;
  signals: number;
  session: string;
}
interface Strategy {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: 'news' | 'pattern' | 'session';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sessions: string[];
  instruments: StrategyInstrument[];
  tpSl: { tp: string; sl: string; ratio: string };
  holdPeriod: string;
  backtestMeta: { period: string; dataPoints: string; instrumentsCount: number; eventsCount?: number };
  status: 'active' | 'paused';
  rules: string[];
  warnings: string[];
  lastEvaluated: string;
}

function getCategoryIcon(cat: Strategy['category']) {
  switch (cat) {
    case 'news': return <Newspaper className="w-3.5 h-3.5" />;
    case 'pattern': return <Layers className="w-3.5 h-3.5" />;
    case 'session': return <Clock className="w-3.5 h-3.5" />;
  }
}

function getCategoryLabel(cat: Strategy['category']) {
  switch (cat) {
    case 'news': return 'News';
    case 'pattern': return 'Pattern';
    case 'session': return 'Session';
  }
}


function getCurrentSession(): string {
  const now = new Date();
  const utcH = now.getUTCHours();
  // SAST = UTC+2
  const sastH = (utcH + 2) % 24;
  if (sastH >= 0 && sastH < 5) return 'night';
  if (sastH >= 5 && sastH < 8) return 'transition';
  return 'day';
}

function getNextHighImpactEvent(): { name: string; timeUntil: number } {
  // Simulate next high-impact event countdown (in a real app, this would come from calendar API)
  const now = Date.now();
  const events = [
    { name: 'US CPI m/m', hourUTC: 13, minute: 30 },
    { name: 'FOMC Decision', hourUTC: 18, minute: 0 },
    { name: 'NFP', hourUTC: 12, minute: 30 },
    { name: 'GDP q/q', hourUTC: 12, minute: 30 },
  ];
  let minDiff = Infinity;
  let nextName = events[0].name;
  for (const ev of events) {
    const evTime = new Date();
    evTime.setUTCHours(ev.hourUTC, ev.minute, 0, 0);
    let diff = evTime.getTime() - now;
    if (diff < 0) diff += 24 * 60 * 60 * 1000;
    if (diff < minDiff) {
      minDiff = diff;
      nextName = ev.name;
    }
  }
  return { name: nextName, timeUntil: Math.floor(minDiff / 60000) };
}

function formatCountdown(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const quickTradePairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP'];

export default function SignalsTab() {
  const [filter, setFilter] = useState<'all' | 'BUY' | 'SELL'>('all');
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcLot, setCalcLot] = useState('0.10');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertPair, setAlertPair] = useState('');
  const orderModal = useOrderModal();
  const [sentimentBull, setSentimentBull] = useState(62);

  // Quick Trade state
  const [qtOpen, setQtOpen] = useState(false);
  const [qtPair, setQtPair] = useState('EUR/USD');
  const [qtDirection, setQtDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [qtLot, setQtLot] = useState(0.1);
  const [qtSlPips, setQtSlPips] = useState(30);
  const [qtTpPips, setQtTpPips] = useState(60);
  const [qtExecuting, setQtExecuting] = useState(false);
  const addToast = useForexStore((s) => s.addToast);

  // Quick trade risk calculation
  const qtRiskAmount = useMemo(() => {
    const isJPY = qtPair.includes('JPY');
    const pipVal = isJPY ? 1000 / qtPair.replace('USD/', '').length : 10;
    const lotMultiplier = qtLot * 100000;
    const pipSize = isJPY ? 0.01 : 0.0001;
    return +(lotMultiplier * pipSize * qtSlPips).toFixed(2);
  }, [qtPair, qtLot, qtSlPips]);

  const handleQuickTrade = useCallback(async () => {
    const selectedPair = basePairs.find(p => p.pair === qtPair);
    const entryPrice = qtDirection === 'BUY'
      ? (selectedPair?.ask ?? 1.0867)
      : (selectedPair?.bid ?? 1.0865);
    const isJPY = qtPair.includes('JPY');
    const pipSize = isJPY ? 0.01 : 0.0001;
    const slPrice = qtDirection === 'BUY'
      ? entryPrice - qtSlPips * pipSize
      : entryPrice + qtSlPips * pipSize;
    const tpPrice = qtDirection === 'BUY'
      ? entryPrice + qtTpPips * pipSize
      : entryPrice - qtTpPips * pipSize;

    setQtExecuting(true);
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pair: qtPair,
          direction: qtDirection,
          entryPrice,
          stopLoss: slPrice,
          takeProfit: tpPrice,
          lotSize: qtLot,
          timeframe: 'H1',
        }),
      });
      if (res.ok) {
        addToast({ message: `${qtDirection} ${qtPair} @ ${entryPrice.toFixed(isJPY ? 3 : 5)} executed`, type: 'success' });
      } else {
        addToast({ message: 'Trade execution failed', type: 'error' });
      }
    } catch {
      addToast({ message: 'Network error', type: 'error' });
    } finally {
      setQtExecuting(false);
    }
  }, [qtPair, qtDirection, qtLot, qtSlPips, qtTpPips, addToast]);

  // Market sentiment simulation
  useEffect(() => {
    const id = setInterval(() => {
      setSentimentBull((prev) => {
        const delta = Math.random() > 0.5 ? 2 : -2;
        const next = Math.min(80, Math.max(45, prev + delta));
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // ── Strategy Engine State ──
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [strategiesLoading, setStrategiesLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [strategyCategoryFilter, setStrategyCategoryFilter] = useState<'all' | 'news' | 'pattern' | 'session'>('all');
  const [nextEvent, setNextEvent] = useState(getNextHighImpactEvent());

  // Fetch strategies on mount
  useEffect(() => {
    fetch('/api/strategies')
      .then((res) => res.json())
      .then((data) => {
        setStrategies(data.strategies || []);
        setStrategiesLoading(false);
      })
      .catch(() => setStrategiesLoading(false));
  }, []);

  // Update countdown every minute
  useEffect(() => {
    const id = setInterval(() => {
      setNextEvent(getNextHighImpactEvent());
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const currentSession = getCurrentSession();

  const filteredStrategies = strategies.filter((s) => {
    if (strategyCategoryFilter !== 'all' && s.category !== strategyCategoryFilter) return false;
    return true;
  });

  // Which strategies are recommended right now
  const recommendedStrategies = strategies.filter((s) => {
    if (s.status !== 'active') return false;
    const session = currentSession;
    if (s.category === 'news') return true; // news strategies are event-driven
    if (s.category === 'session' || s.category === 'pattern') {
      if (session === 'night') return s.sessions.some((se) => se.toLowerCase().includes('night') || se.toLowerCase().includes('00:00'));
      if (session === 'day') return s.sessions.some((se) => se.toLowerCase().includes('day') || se.toLowerCase().includes('08:00'));
    }
    return true;
  });

  const filteredSignals = signals.filter((s) => {
    if (filter !== 'all' && s.direction !== filter) return false;
    return true;
  });

  const activeSignals = filteredSignals.filter(s => s.status === 'active');

  // Calculator
  const selectedSignal = expandedSignal ? signals.find(s => s.id === expandedSignal) : null;
  const calcLotNum = parseFloat(calcLot) || 0;
  const lotSize = selectedSignal?.pair.includes('JPY') ? 1000 : 100000;
  const pipValue = selectedSignal ? +(lotSize * calcLotNum * 0.0001).toFixed(2) : 0;
  const slPips = selectedSignal ? Math.abs(selectedSignal.entryPrice - selectedSignal.stopLoss) : 0;
  const tpPips = selectedSignal ? Math.abs(selectedSignal.takeProfit - selectedSignal.entryPrice) : 0;
  const isJPY = selectedSignal?.pair.includes('JPY') || false;
  const slRisk = selectedSignal ? +(isJPY ? (slPips * pipValue * 100) : (slPips / 0.0001 * pipValue)).toFixed(2) : 0;
  const tpReward = selectedSignal ? +(isJPY ? (tpPips * pipValue * 100) : (tpPips / 0.0001 * pipValue)).toFixed(2) : 0;

  const handleCopySignal = useCallback((signal: TradingSignal) => {
    const text = `${signal.direction} ${signal.pair} @ ${formatPrice(signal.entryPrice, signal.pair)} | SL: ${formatPrice(signal.stopLoss, signal.pair)} | TP: ${formatPrice(signal.takeProfit, signal.pair)} | R:R ${((Math.abs(signal.takeProfit - signal.entryPrice)) / Math.abs(signal.entryPrice - signal.stopLoss)).toFixed(1)}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(signal.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Quick Trade Widget */}
      <div className="px-4 pt-2.5">
        <motion.div
          layout
          className="glass rounded-xl overflow-hidden noise-overlay"
        >
          {/* Toggle Button */}
          <button
            onClick={() => setQtOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[var(--forex-accent)]/15 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-[var(--forex-accent)]" />
              </div>
              <span className="text-xs font-bold">Quick Trade</span>
              <span className="action-pill text-[8px] px-1.5 py-0.5 font-bold">1-CLICK</span>
            </div>
            <motion.div
              animate={{ rotate: qtOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-[var(--forex-muted)]" />
            </motion.div>
          </button>

          <AnimatePresence>
            {qtOpen && (
              <motion.div
                layout
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="px-3.5 pb-3.5 space-y-3">
                  {/* Pair Selector */}
                  <div className="glass-deep rounded-lg p-2.5">
                    <div className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold mb-1.5">Pair</div>
                    <select
                      value={qtPair}
                      onChange={(e) => setQtPair(e.target.value)}
                      className="w-full bg-white/[0.06] rounded-lg px-2.5 py-1.5 text-[12px] font-mono font-bold text-[var(--forex-text)] outline-none focus:ring-1 focus:ring-[var(--forex-accent)]/30 appearance-none cursor-pointer"
                    >
                      {quickTradePairs.map((p) => (
                        <option key={p} value={p} className="bg-[var(--forex-bg)]">{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Direction Toggle */}
                  <div className="glass-deep rounded-lg p-2.5">
                    <div className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold mb-1.5">Direction</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <LiquidGlass>
                        <button
                          onClick={() => setQtDirection('BUY')}
                          className={`btn-3d-press w-full py-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                            qtDirection === 'BUY'
                              ? 'bg-[var(--profit)]/15 border border-[var(--profit)]/30 text-[var(--profit)]'
                              : 'glass-subtle text-[var(--forex-muted)]'
                          }`}
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          BUY
                        </button>
                      </LiquidGlass>
                      <LiquidGlass>
                        <button
                          onClick={() => setQtDirection('SELL')}
                          className={`btn-3d-press w-full py-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                            qtDirection === 'SELL'
                              ? 'bg-[var(--loss)]/15 border border-[var(--loss)]/30 text-[var(--loss)]'
                              : 'glass-subtle text-[var(--forex-muted)]'
                          }`}
                        >
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          SELL
                        </button>
                      </LiquidGlass>
                    </div>
                  </div>

                  {/* Lot Size Quick Buttons */}
                  <div className="glass-deep rounded-lg p-2.5">
                    <div className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold mb-1.5">Lot Size</div>
                    <div className="grid grid-cols-6 gap-1">
                      {[0.01, 0.05, 0.1, 0.25, 0.5, 1.0].map((lot) => (
                        <LiquidGlass key={lot}>
                          <button
                            onClick={() => setQtLot(lot)}
                            className={`btn-3d-press w-full py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                              qtLot === lot
                                ? 'bg-[var(--forex-accent)]/15 border border-[var(--forex-accent)]/30 text-[var(--forex-accent)]'
                                : 'glass-subtle text-[var(--forex-muted)]'
                            }`}
                          >
                            {lot}
                          </button>
                        </LiquidGlass>
                      ))}
                    </div>
                  </div>

                  {/* SL/TP Pips */}
                  <div className="glass-deep rounded-lg p-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[9px] text-[var(--loss)] uppercase tracking-wider font-semibold mb-1">SL (pips)</div>
                        <input
                          type="number"
                          value={qtSlPips}
                          onChange={(e) => setQtSlPips(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-white/[0.06] rounded-lg px-2.5 py-1.5 text-[12px] font-mono font-bold text-[var(--loss)] outline-none focus:ring-1 focus:ring-[var(--loss)]/30 text-center"
                        />
                      </div>
                      <div>
                        <div className="text-[9px] text-[var(--profit)] uppercase tracking-wider font-semibold mb-1">TP (pips)</div>
                        <input
                          type="number"
                          value={qtTpPips}
                          onChange={(e) => setQtTpPips(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-white/[0.06] rounded-lg px-2.5 py-1.5 text-[12px] font-mono font-bold text-[var(--profit)] outline-none focus:ring-1 focus:ring-[var(--profit)]/30 text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Risk Display + Execute */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 glass-subtle rounded-lg px-3 py-2 flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-[var(--forex-muted)]" />
                      <div>
                        <div className="text-[8px] text-[var(--forex-muted)] uppercase tracking-wider">Risk</div>
                        <div className="text-[13px] font-mono font-bold text-[var(--gold)]">${qtRiskAmount.toFixed(2)}</div>
                      </div>
                    </div>
                    <LiquidGlass>
                      <button
                        onClick={handleQuickTrade}
                        disabled={qtExecuting}
                        className={`btn-3d-press corner-bracket relative px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 ${
                          qtDirection === 'BUY'
                            ? 'bg-[var(--profit)]/20 border border-[var(--profit)]/40 text-[var(--profit)]'
                            : 'bg-[var(--loss)]/20 border border-[var(--loss)]/40 text-[var(--loss)]'
                        } ${qtExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        {qtExecuting ? '...' : 'EXECUTE'}
                      </button>
                    </LiquidGlass>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Strategy Engine */}
      <div className="border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-[var(--forex-accent)]" />
            <span className="text-sm font-semibold">Strategy Engine</span>
            <span className="action-pill text-[8px] px-1.5 py-0.5 font-bold">BACKTESTED</span>
          </div>
        </div>

        {/* Strategy Radar - session status + next event + active count */}
        <div className="glass rounded-xl p-2.5 mb-2.5">
          <div className="grid grid-cols-3 gap-2">
            <div className="glass-subtle rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Activity className={`w-3 h-3 ${currentSession === 'night' ? 'text-[var(--profit)]' : currentSession === 'day' ? 'text-[var(--gold)]' : 'text-[var(--forex-muted)]'}`} />
                <span className="text-[8px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold">Session</span>
              </div>
              <span className={`text-[11px] font-bold ${currentSession === 'night' ? 'text-[var(--profit)]' : currentSession === 'day' ? 'text-[var(--gold)]' : 'text-[var(--forex-muted)]'}`}>
                {currentSession === 'night' ? 'NIGHT' : currentSession === 'day' ? 'DAY' : 'TRANS'}
              </span>
            </div>
            <div className="glass-subtle rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Timer className="w-3 h-3 text-[var(--gold)]" />
                <span className="text-[8px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold">Next Event</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-[var(--gold)]">{formatCountdown(nextEvent.timeUntil)}</span>
            </div>
            <div className="glass-subtle rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <ShieldCheck className="w-3 h-3 text-[var(--forex-accent)]" />
                <span className="text-[8px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold">Active</span>
              </div>
              <span className="text-[11px] font-bold text-[var(--forex-accent)]">{recommendedStrategies.length}</span>
            </div>
          </div>
          {/* Next event label */}
          <div className="mt-1.5 flex items-center justify-center gap-1">
            <span className="text-[8px] text-[var(--forex-muted)]">Next:</span>
            <span className="text-[9px] font-bold text-[var(--gold)]">{nextEvent.name}</span>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 mb-2.5">
          {(['all', 'news', 'pattern', 'session'] as const).map((cat) => (
            <LiquidGlass key={cat}>
              <button
                onClick={() => setStrategyCategoryFilter(cat)}
                className={`btn-3d px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 ${
                  strategyCategoryFilter === cat
                    ? 'glass-strong text-[var(--forex-accent)] border-gradient-animated'
                    : 'glass-subtle text-[var(--forex-muted)] hover:text-[var(--forex-text)]'
                }`}
              >
                {cat !== 'all' && getCategoryIcon(cat)}
                {cat === 'all' ? 'All' : getCategoryLabel(cat)}
              </button>
            </LiquidGlass>
          ))}
          <div className="flex-1" />
          <span className="text-[9px] text-[var(--forex-muted)] font-medium">{filteredStrategies.length} strategies</span>
        </div>

        {/* Strategy Cards - Horizontal Scroll */}
        {strategiesLoading ? (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 glass rounded-xl p-3 min-w-[155px] animate-pulse">
                <div className="h-3 bg-white/[0.06] rounded mb-2 w-3/4" />
                <div className="h-2 bg-white/[0.06] rounded mb-1 w-1/2" />
                <div className="h-2 bg-white/[0.06] rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {filteredStrategies.map((strategy) => {
              const isActive = strategy.status === 'active';
              const isRecommended = recommendedStrategies.some((r) => r.id === strategy.id);
              const isSelected = selectedStrategy?.id === strategy.id;
              const topWinRate = Math.max(...strategy.instruments.map((i) => i.winRate));

              return (
                <LiquidGlass key={strategy.id}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedStrategy(isSelected ? null : strategy)}
                    className={`flex-shrink-0 glass rounded-xl p-3 min-w-[155px] text-left transition-all ${
                      isSelected
                        ? 'ring-1 ring-[var(--forex-accent)]/50 glass-strong'
                        : isRecommended && isActive
                        ? 'ring-1 ring-[var(--profit)]/30'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                          strategy.category === 'news' ? 'bg-[var(--gold)]/15 text-[var(--gold)]' :
                          strategy.category === 'pattern' ? 'bg-[var(--forex-accent)]/15 text-[var(--forex-accent)]' :
                          'bg-[var(--profit)]/15 text-[var(--profit)]'
                        }`}>
                          {getCategoryIcon(strategy.category)}
                        </div>
                        <span className="text-[11px] font-bold truncate max-w-[90px]">{strategy.name}</span>
                      </div>
                      {isActive && isRecommended && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--profit)] animate-pulse" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        strategy.difficulty === 'beginner' ? 'bg-[var(--profit)]/10 text-[var(--profit)]' :
                        strategy.difficulty === 'intermediate' ? 'bg-[var(--gold)]/10 text-[var(--gold)]' :
                        'bg-[var(--loss)]/10 text-[var(--loss)]'
                      }`}>
                        {strategy.difficulty.toUpperCase()}
                      </span>
                      <span className="text-[9px] font-medium text-[var(--forex-muted)]">{strategy.sessions[0]?.split('(')[0]?.trim()}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-[var(--profit)]" />
                        <span className="text-[10px] font-bold text-[var(--profit)]">{topWinRate}%</span>
                        <span className="text-[8px] text-[var(--forex-muted)]">top</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 text-[var(--forex-muted)] transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </motion.button>
                </LiquidGlass>
              );
            })}
          </div>
        )}

        {/* Selected Strategy Detail Panel */}
        <AnimatePresence>
          {selectedStrategy && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-2.5 glass-deep rounded-xl p-3 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold">{selectedStrategy.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        selectedStrategy.difficulty === 'beginner' ? 'bg-[var(--profit)]/10 text-[var(--profit)]' :
                        selectedStrategy.difficulty === 'intermediate' ? 'bg-[var(--gold)]/10 text-[var(--gold)]' :
                        'bg-[var(--loss)]/10 text-[var(--loss)]'
                      }`}>
                        {selectedStrategy.difficulty.toUpperCase()}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        selectedStrategy.status === 'active' ? 'bg-[var(--profit)]/10 text-[var(--profit)]' : 'bg-white/[0.06] text-[var(--forex-muted)]'
                      }`}>
                        {selectedStrategy.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[var(--forex-text)]/70">{selectedStrategy.description}</p>
                  </div>
                </div>

                {/* TP/SL and Hold Period */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="glass-subtle rounded-lg p-2 text-center">
                    <div className="text-[8px] text-[var(--profit)] uppercase tracking-wider font-semibold mb-0.5">TP</div>
                    <div className="text-[10px] font-mono font-bold text-[var(--profit)] leading-tight">{selectedStrategy.tpSl.tp.split('/')[0].trim()}</div>
                  </div>
                  <div className="glass-subtle rounded-lg p-2 text-center">
                    <div className="text-[8px] text-[var(--loss)] uppercase tracking-wider font-semibold mb-0.5">SL</div>
                    <div className="text-[10px] font-mono font-bold text-[var(--loss)] leading-tight">{selectedStrategy.tpSl.sl.split('/')[0].trim()}</div>
                  </div>
                  <div className="glass-subtle rounded-lg p-2 text-center">
                    <div className="text-[8px] text-[var(--gold)] uppercase tracking-wider font-semibold mb-0.5">R:R</div>
                    <div className="text-[10px] font-mono font-bold text-[var(--gold)]">{selectedStrategy.tpSl.ratio}</div>
                  </div>
                </div>

                {/* Hold Period + Sessions */}
                <div className="flex items-center gap-2 text-[9px] text-[var(--forex-muted)]">
                  <div className="flex items-center gap-1 px-2 py-1 rounded glass-subtle">
                    <Timer className="w-3 h-3" />
                    <span className="font-medium">{selectedStrategy.holdPeriod}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded glass-subtle">
                    <Clock className="w-3 h-3" />
                    <span className="font-medium">{selectedStrategy.sessions.length} session{selectedStrategy.sessions.length > 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Top Instruments */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Shield className="w-3.5 h-3.5 text-[var(--forex-accent)]" />
                    <span className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold">Best Instruments</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStrategy.instruments
                      .sort((a, b) => b.winRate - a.winRate)
                      .slice(0, 6)
                      .map((inst) => (
                        <div
                          key={`${inst.pair}-${inst.session}`}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium ${
                            inst.winRate >= 90
                              ? 'bg-[var(--profit)]/10 text-[var(--profit)] border border-[var(--profit)]/20'
                              : inst.winRate >= 75
                              ? 'bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/15'
                              : 'glass-subtle text-[var(--forex-text)]'
                          }`}
                        >
                          <span className="font-bold font-mono">{inst.pair}</span>
                          <span className="font-bold">{inst.winRate}%</span>
                          {inst.profitFactor && <span className="text-[8px] opacity-60">PF:{inst.profitFactor}</span>}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Trading Rules */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Target className="w-3.5 h-3.5 text-[var(--forex-accent)]" />
                    <span className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold">Rules</span>
                  </div>
                  <ol className="space-y-1">
                    {selectedStrategy.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-[10px] leading-relaxed text-[var(--forex-text)]/80">
                        <span className="flex-shrink-0 w-4 h-4 rounded bg-[var(--forex-accent)]/15 text-[var(--forex-accent)] flex items-center justify-center text-[8px] font-bold mt-0.5">
                          {i + 1}
                        </span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Warnings */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[var(--gold)]" />
                    <span className="text-[9px] text-[var(--gold)] uppercase tracking-wider font-semibold">Warnings</span>
                  </div>
                  <ul className="space-y-1">
                    {selectedStrategy.warnings.map((warning, i) => (
                      <li key={i} className="flex items-start gap-2 text-[10px] leading-relaxed text-[var(--forex-text)]/60">
                        <span className="text-[var(--gold)] mt-0.5">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Backtest Meta */}
                <div className="flex items-center gap-3 text-[9px] text-[var(--forex-muted)]">
                  <span className="font-mono">Period: {selectedStrategy.backtestMeta.period}</span>
                  <span className="font-mono">Data: {selectedStrategy.backtestMeta.dataPoints}</span>
                  <span className="font-mono">{selectedStrategy.backtestMeta.instrumentsCount} pairs</span>
                  {selectedStrategy.backtestMeta.eventsCount && <span className="font-mono">{selectedStrategy.backtestMeta.eventsCount} events</span>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Market Sentiment Gauge */}
      <div className="border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--forex-accent)]" />
            <span className="text-sm font-semibold">Market Sentiment</span>
          </div>
        </div>
        <div className="glass rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-[var(--profit)] flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Bullish {sentimentBull}%
            </span>
            <span className="text-[10px] font-semibold text-[var(--loss)] flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Bearish {100 - sentimentBull}%
            </span>
          </div>
          <div className="sentiment-gauge">
            <div
              className="sentiment-gauge-fill"
              style={{ width: `${sentimentBull}%` }}
            />
            <div
              className="sentiment-marker"
              style={{ left: `${sentimentBull}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[var(--forex-muted)]" />
          <span className="text-[11px] text-[var(--forex-muted)] font-medium">Filter:</span>
        </div>
        {(['all', 'BUY', 'SELL'] as const).map((f) => (
          <LiquidGlass key={f}>
            <button
              onClick={() => setFilter(f)}
              className={`btn-3d px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                filter === f
                  ? 'glass-strong text-[var(--forex-accent)] border-gradient-animated'
                  : 'glass-subtle text-[var(--forex-muted)] hover:text-[var(--forex-text)]'
              }`}
            >
              {f}
            </button>
          </LiquidGlass>
        ))}
        <div className="flex-1" />
        <span className="text-[11px] text-[var(--forex-muted)] font-medium">{activeSignals.length} active</span>
      </div>

      {/* Signals List */}
      <div className="flex-1 overflow-y-auto forex-scrollbar px-4 py-2.5 space-y-2.5">
        <AnimatePresence>
          {filteredSignals.map((signal) => (
            <motion.div
              key={signal.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className={`signal-card glass rounded-xl overflow-hidden noise-overlay glass-prismatic ${signal.confidence >= 80 ? 'breathe-glow-slow' : ''}`}
            >
              <LiquidGlass>
                <div
                  onClick={() => {
                    setExpandedSignal(expandedSignal === signal.id ? null : signal.id);
                    setShowCalculator(false);
                  }}
                  className="p-3.5 cursor-pointer"
                >
                  {/* Signal Header */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center card-depth-1 ${
                        signal.direction === 'BUY'
                          ? 'bg-[var(--profit)]/15 text-[var(--profit)]'
                          : 'bg-[var(--loss)]/15 text-[var(--loss)]'
                      }`}>
                        {signal.direction === 'BUY' ? <ArrowUpRight className="w-4 h-4 arrow-pulse-up" /> : <ArrowDownRight className="w-4 h-4 arrow-pulse-down" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{signal.pair}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            signal.direction === 'BUY'
                              ? 'bg-[var(--profit)]/15 text-[var(--profit)]'
                              : 'bg-[var(--loss)]/15 text-[var(--loss)]'
                          }`}>
                            {signal.direction}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className={`w-3 h-3 ${signal.confidence >= 80 ? 'text-[var(--gold)] fill-[var(--gold)]' : 'text-[var(--forex-muted)]'}`} />
                        <span className="text-[11px] font-bold">{signal.confidence}%</span>
                      </div>
                      <span className="text-[9px] text-[var(--forex-muted)] px-1.5 py-0.5 rounded bg-white/[0.04] font-medium">{signal.timeframe}</span>
                    </div>
                  </div>

                  {/* Price Levels */}
                  <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                    <div className="glass-subtle rounded-lg p-2 text-center">
                      <div className="text-[9px] text-[var(--forex-muted)] mb-0.5 uppercase tracking-wider">Entry</div>
                      <div className="text-[12px] font-mono font-bold tabular-nums">{formatPrice(signal.entryPrice, signal.pair)}</div>
                    </div>
                    <div className="glass-subtle rounded-lg p-2 text-center">
                      <div className="text-[9px] text-[var(--loss)] mb-0.5 uppercase tracking-wider">SL</div>
                      <div className="text-[12px] font-mono font-bold text-[var(--loss)] tabular-nums">{formatPrice(signal.stopLoss, signal.pair)}</div>
                    </div>
                    <div className="glass-subtle rounded-lg p-2 text-center">
                      <div className="text-[9px] text-[var(--profit)] mb-0.5 uppercase tracking-wider">TP</div>
                      <div className="text-[12px] font-mono font-bold text-[var(--profit)] tabular-nums">{formatPrice(signal.takeProfit, signal.pair)}</div>
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-2.5">
                    <motion.div
                      className="confidence-bar h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${signal.confidence}%` }}
                      transition={{ duration: 0.8, delay: 0.15 }}
                    />
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-white/[0.06] flex items-center justify-center text-[9px] font-bold text-[var(--forex-muted)]">
                        {signal.username.charAt(0)}
                      </div>
                      <span className="text-[10px] text-[var(--forex-muted)] font-medium">{signal.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-[var(--gold)]" />
                        <span className="text-[10px] text-[var(--forex-muted)] font-medium">
                          R:R {((Math.abs(signal.takeProfit - signal.entryPrice)) / Math.abs(signal.entryPrice - signal.stopLoss)).toFixed(1)}
                        </span>
                      </div>
                      {/* Quick action buttons */}
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedSignal(signal.id);
                          setShowCalculator(true);
                        }}
                        className="p-1 rounded hover:bg-white/[0.06] transition-colors"
                      >
                        <Calculator className="w-3.5 h-3.5 text-[var(--forex-muted)]" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setAlertPair(signal.pair);
                          setAlertModalOpen(true);
                        }}
                        className="p-1 rounded hover:bg-white/[0.06] transition-colors"
                      >
                        <Bell className="w-3.5 h-3.5 text-[var(--gold)]" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          orderModal.open({
                            pair: signal.pair,
                            direction: signal.direction,
                            entryPrice: signal.entryPrice,
                            stopLoss: signal.stopLoss,
                            takeProfit: signal.takeProfit,
                            timeframe: signal.timeframe,
                          });
                        }}
                        className="p-1 rounded hover:bg-white/[0.06] transition-colors"
                        title="Execute Trade"
                      >
                        <Play className="w-3.5 h-3.5 text-[var(--forex-accent)]" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopySignal(signal);
                        }}
                        className="p-1 rounded hover:bg-white/[0.06] transition-colors"
                      >
                        {copiedId === signal.id ? (
                          <motion.span
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-[8px] font-bold text-[var(--profit)]"
                          >
                            OK
                          </motion.span>
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[var(--forex-muted)]" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* Expanded sections */}
                  <AnimatePresence>
                    {expandedSignal === signal.id && signal.analysis && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2.5 pt-2.5 border-t border-white/[0.06]">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold">Price Action</div>
                            <div className="text-[8px] text-[var(--forex-muted)]/50 font-mono">H4</div>
                          </div>
                          <div className="rounded-lg overflow-hidden micro-glass p-2 mb-3">
                            <MiniCandlestickChart width={300} height={80} className={`candle-${signal.id}`} />
                          </div>
                          <div className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold mb-1">Analysis</div>
                          <p className="text-[11px] leading-relaxed text-[var(--forex-text)]/80">{signal.analysis}</p>
                        </div>
                      </motion.div>
                    )}

                    {expandedSignal === signal.id && showCalculator && selectedSignal && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2.5 pt-2.5 border-t border-white/[0.06]">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <Calculator className="w-3 h-3 text-[var(--forex-accent)]" />
                              <span className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold">Position Calculator</span>
                            </div>
                          </div>
                          <div className="glass-deep rounded-lg p-3">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] text-[var(--forex-muted)] font-medium">Lot Size</span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  value={calcLot}
                                  onChange={(e) => setCalcLot(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-16 bg-white/[0.06] rounded px-2 py-1 text-[11px] font-mono font-bold text-center text-[var(--forex-text)] outline-none focus:ring-1 focus:ring-[var(--forex-accent)]/30"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="rounded-lg bg-[var(--loss)]/8 border border-[var(--loss)]/15 p-2 text-center card-depth-1">
                                <div className="text-[8px] text-[var(--loss)] uppercase tracking-wider font-semibold">SL Risk</div>
                                <div className="text-sm font-mono font-bold text-[var(--loss)] tabular-nums">${slRisk.toFixed(0)}</div>
                              </div>
                              <div className="rounded-lg bg-[var(--profit)]/8 border border-[var(--profit)]/15 p-2 text-center card-depth-1">
                                <div className="text-[8px] text-[var(--profit)] uppercase tracking-wider font-semibold">TP Reward</div>
                                <div className="text-sm font-mono font-bold text-[var(--profit)] tabular-nums">${tpReward.toFixed(0)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </LiquidGlass>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <PriceAlertModal isOpen={alertModalOpen} onClose={() => setAlertModalOpen(false)} pair={alertPair} />
      <OrderExecutionModal
        isOpen={orderModal.isOpen}
        onClose={orderModal.close}
        pair={orderModal.props?.pair}
        direction={orderModal.props?.direction}
        entryPrice={orderModal.props?.entryPrice}
        stopLoss={orderModal.props?.stopLoss}
        takeProfit={orderModal.props?.takeProfit}
        timeframe={orderModal.props?.timeframe}
      />
    </div>
  );
}
