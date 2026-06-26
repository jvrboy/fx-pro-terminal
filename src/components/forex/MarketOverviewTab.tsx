'use client';

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Clock,
  Activity,
  Zap,
  RefreshCw,
  DollarSign,
  Coins,
  Gauge,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Calculator,
} from 'lucide-react';
import LiquidGlass from './LiquidGlass';
import PositionSizeCalculator, { usePositionCalc } from './PositionSizeCalculator';
import CurrencyStrengthMeter from './CurrencyStrengthMeter';
import { useForexStore } from '@/lib/store';
import type { MarketPair } from '@/types/forex';

// ─── Local Data ───────────────────────────────────────────────────────────────

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

const indicesData = [
  { name: 'DXY', value: 104.32, change: 0.18, changePercent: 0.17 },
  { name: 'S&P 500', value: 5892.47, change: 23.65, changePercent: 0.40 },
  { name: 'NASDAQ', value: 18439.12, change: -45.30, changePercent: -0.25 },
  { name: 'FTSE 100', value: 8234.56, change: 12.80, changePercent: 0.16 },
  { name: 'Nikkei 225', value: 38456.70, change: -189.40, changePercent: -0.49 },
  { name: 'DAX', value: 19432.15, change: 67.30, changePercent: 0.35 },
];

const commoditiesData = [
  { name: 'Gold', price: 2342.50, unit: 'USD/oz', change: 12.30, changePercent: 0.53, icon: '🥇' },
  { name: 'Silver', price: 28.45, unit: 'USD/oz', change: -0.18, changePercent: -0.63, icon: '🥈' },
  { name: 'WTI Oil', price: 78.62, unit: 'USD/bbl', change: 0.85, changePercent: 1.09, icon: '🛢️' },
  { name: 'Brent Oil', price: 82.14, unit: 'USD/bbl', change: 0.72, changePercent: 0.88, icon: '🛢️' },
];

type SessionStatus = 'open' | 'closed' | 'pre-market' | 'overlapping';

interface SessionInfo {
  name: string;
  city: string;
  status: SessionStatus;
  openTime: string;
  closeTime: string;
  rangeHigh: number;
  rangeLow: number;
  rangePips: number;
}

function getSessions(): SessionInfo[] {
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();

  const isOpen = (open: number, close: number) => {
    if (open < close) return utcH >= open && utcH < close;
    return utcH >= open || utcH < close;
  };

  const sydneyOpen = isOpen(21, 6);
  const tokyoOpen = isOpen(0, 9);
  const londonOpen = isOpen(7, 16);
  const nyOpen = isOpen(12, 21);

  const sydneyLondon = sydneyOpen && londonOpen;
  const londonNy = londonOpen && nyOpen;

  return [
    {
      name: 'Sydney',
      city: 'AEST',
      status: sydneyOpen ? (sydneyLondon ? 'overlapping' as const : 'open' as const) : 'closed' as const,
      openTime: '22:00',
      closeTime: '07:00',
      rangeHigh: 1.0880,
      rangeLow: 1.0845,
      rangePips: 35,
    },
    {
      name: 'Tokyo',
      city: 'JST',
      status: tokyoOpen ? (londonOpen ? 'overlapping' as const : 'open' as const) : 'closed' as const,
      openTime: '00:00',
      closeTime: '09:00',
      rangeHigh: 157.45,
      rangeLow: 156.90,
      rangePips: 55,
    },
    {
      name: 'London',
      city: 'GMT',
      status: londonOpen ? (londonNy ? 'overlapping' as const : 'open' as const) : (utcH >= 6 && utcH < 7 ? 'pre-market' as const : 'closed' as const),
      openTime: '08:00',
      closeTime: '17:00',
      rangeHigh: 1.0892,
      rangeLow: 1.0834,
      rangePips: 58,
    },
    {
      name: 'New York',
      city: 'EST',
      status: nyOpen ? (londonNy ? 'overlapping' as const : 'open' as const) : (utcH >= 11 && utcH < 12 ? 'pre-market' as const : 'closed' as const),
      openTime: '13:00',
      closeTime: '22:00',
      rangeHigh: 1.0878,
      rangeLow: 1.0840,
      rangePips: 38,
    },
  ];
}

const correlationMatrix: { pair1: string; pair2: string; value: number }[] = [
  { pair1: 'EUR/USD', pair2: 'GBP/USD', value: 0.85 },
  { pair1: 'EUR/USD', pair2: 'AUD/USD', value: 0.72 },
  { pair1: 'EUR/USD', pair2: 'NZD/USD', value: 0.68 },
  { pair1: 'EUR/USD', pair2: 'USD/CHF', value: -0.92 },
  { pair1: 'EUR/USD', pair2: 'USD/JPY', value: -0.31 },
  { pair1: 'EUR/USD', pair2: 'USD/CAD', value: -0.78 },
  { pair1: 'GBP/USD', pair2: 'AUD/USD', value: 0.61 },
  { pair1: 'GBP/USD', pair2: 'NZD/USD', value: 0.58 },
  { pair1: 'GBP/USD', pair2: 'USD/CHF', value: -0.75 },
  { pair1: 'GBP/USD', pair2: 'USD/JPY', value: -0.22 },
  { pair1: 'GBP/USD', pair2: 'USD/CAD', value: -0.65 },
  { pair1: 'AUD/USD', pair2: 'NZD/USD', value: 0.89 },
  { pair1: 'AUD/USD', pair2: 'USD/CHF', value: -0.55 },
  { pair1: 'AUD/USD', pair2: 'USD/JPY', value: -0.15 },
  { pair1: 'AUD/USD', pair2: 'USD/CAD', value: -0.48 },
  { pair1: 'NZD/USD', pair2: 'USD/CHF', value: -0.50 },
  { pair1: 'NZD/USD', pair2: 'USD/JPY', value: -0.10 },
  { pair1: 'NZD/USD', pair2: 'USD/CAD', value: -0.42 },
  { pair1: 'USD/CHF', pair2: 'USD/JPY', value: 0.38 },
  { pair1: 'USD/CHF', pair2: 'USD/CAD', value: 0.82 },
  { pair1: 'USD/JPY', pair2: 'USD/CAD', value: 0.25 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number, pair: string) {
  const decimals = pair.includes('JPY') ? 2 : 4;
  return price.toFixed(decimals);
}

// ─── Sparkline (SVG polyline, no external lib) ────────────────────────────────

function MiniSparkline({ positive, seed, width = 80, height = 28 }: { positive: boolean; seed: number; width?: number; height?: number }) {
  const points = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 16; i++) {
      const base = height / 2;
      const trend = positive ? i * 0.6 : -i * 0.6;
      const noise = Math.sin((i + seed) * 1.7) * 4 + Math.cos((i + seed) * 0.8) * 3;
      arr.push(base + trend + noise);
    }
    return arr;
  }, [positive, seed, height]);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const polylinePoints = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - 2 - ((p - min) / range) * (height - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const areaPoints = `${polylinePoints} ${width},${height} 0,${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-80">
      <defs>
        <linearGradient id={`spark-mo-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={positive ? 'var(--profit)' : 'var(--loss)'} stopOpacity="0.25" />
          <stop offset="100%" stopColor={positive ? 'var(--profit)' : 'var(--loss)'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-mo-${seed})`} />
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={positive ? 'var(--profit)' : 'var(--loss)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Sentiment Arc Gauge (SVG) ────────────────────────────────────────────────

function SentimentGauge({ value }: { value: number }) {
  // value: 0–100, 50 = neutral, >50 = bullish, <50 = bearish
  const r = 52;
  const cx = 60;
  const cy = 60;
  const strokeWidth = 10;
  const startAngle = 135; // degrees
  const endAngle = 405;
  const totalSweep = endAngle - startAngle; // 270 degrees

  const polarToCart = (angle: number) => ({
    x: cx + r * Math.cos((angle * Math.PI) / 180),
    y: cy + r * Math.sin((angle * Math.PI) / 180),
  });

  const arcPath = (start: number, end: number) => {
    const s = polarToCart(start);
    const e = polarToCart(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const valueAngle = startAngle + (value / 100) * totalSweep;
  const valuePoint = polarToCart(valueAngle);

  const sentiment = value >= 58 ? 'Bullish' : value <= 42 ? 'Bearish' : 'Neutral';
  const sentimentColor = value >= 58 ? 'var(--profit)' : value <= 42 ? 'var(--loss)' : 'var(--gold)';

  return (
    <div className="flex flex-col items-center">
      <svg width={120} height={85} viewBox="0 0 120 85" className="overflow-visible">
        {/* Background arc */}
        <path
          d={arcPath(startAngle, endAngle)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Colored arc up to value */}
        <path
          d={arcPath(startAngle, valueAngle)}
          fill="none"
          stroke={sentimentColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${sentimentColor})` }}
        />
        {/* Tick labels */}
        <text x={cx - r - 6} y={cy + 22} textAnchor="middle" fontSize="8" fill="var(--forex-muted)" fontFamily="monospace">
          0
        </text>
        <text x={cx + r + 6} y={cy + 22} textAnchor="middle" fontSize="8" fill="var(--forex-muted)" fontFamily="monospace">
          100
        </text>
        {/* Needle dot */}
        <circle cx={valuePoint.x} cy={valuePoint.y} r={4} fill={sentimentColor} style={{ filter: `drop-shadow(0 0 4px ${sentimentColor})` }} />
      </svg>
      <div className="flex items-center gap-1.5 mt-0.5">
        <motion.span
          className="text-lg font-bold font-mono tabular-nums"
          style={{ color: sentimentColor }}
          key={Math.round(value)}
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {Math.round(value)}
        </motion.span>
        <span className="text-xs font-semibold" style={{ color: sentimentColor }}>
          {sentiment}
        </span>
      </div>
      <div className="flex items-center justify-between w-full mt-1 px-2">
        <span className="text-[9px] text-[var(--loss)] font-medium flex items-center gap-0.5">
          <TrendingDown className="w-2.5 h-2.5" /> Bearish
        </span>
        <span className="text-[9px] text-[var(--profit)] font-medium flex items-center gap-0.5">
          Bullish <TrendingUp className="w-2.5 h-2.5" />
        </span>
      </div>
    </div>
  );
}

// ─── Volatility Bar ───────────────────────────────────────────────────────────

function VolatilityBar({ value }: { value: number }) {
  // value: 0–100
  const clamped = Math.min(100, Math.max(0, value));
  const level = clamped < 25 ? 'Low' : clamped < 50 ? 'Moderate' : clamped < 75 ? 'High' : 'Extreme';
  const color = clamped < 25 ? 'var(--profit)' : clamped < 50 ? 'var(--gold)' : clamped < 75 ? '#f59e0b' : 'var(--loss)';

  const segments = 20;
  const filledSegments = Math.round((clamped / 100) * segments);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" style={{ color }} />
          <span className="text-[10px] font-semibold text-[var(--forex-muted)] uppercase tracking-wider">VIX-style Volatility</span>
        </div>
        <span className="text-sm font-mono font-bold tabular-nums" style={{ color }}>
          {clamped.toFixed(1)}
        </span>
      </div>
      <div className="flex gap-[2px] h-3">
        {Array.from({ length: segments }).map((_, i) => {
          const segValue = (i / segments) * 100;
          const segColor = segValue < 25 ? 'var(--profit)' : segValue < 50 ? 'var(--gold)' : segValue < 75 ? '#f59e0b' : 'var(--loss)';
          return (
            <motion.div
              key={i}
              className="flex-1 rounded-sm"
              initial={{ scaleY: 0.3, opacity: 0.3 }}
              animate={{
                scaleY: i < filledSegments ? 1 : 0.4,
                opacity: i < filledSegments ? 1 : 0.2,
                backgroundColor: i < filledSegments ? segColor : 'rgba(255,255,255,0.06)',
              }}
              transition={{ duration: 0.5, delay: i * 0.02 }}
              style={{ transformOrigin: 'bottom' }}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-[var(--forex-muted)]">Low</span>
        <span className="text-[10px] font-bold" style={{ color }}>{level}</span>
        <span className="text-[9px] text-[var(--forex-muted)]">Extreme</span>
      </div>
    </div>
  );
}

// ─── Correlation Cell ─────────────────────────────────────────────────────────

function CorrelationCell({ value }: { value: number }) {
  const abs = Math.abs(value);
  let bg = 'rgba(255,255,255,0.04)';
  let text = 'var(--forex-muted)';

  if (value > 0.7) {
    bg = 'rgba(34,197,94,0.15)';
    text = 'var(--profit)';
  } else if (value > 0.4) {
    bg = 'rgba(34,197,94,0.07)';
    text = 'var(--profit)';
  } else if (value < -0.7) {
    bg = 'rgba(239,68,68,0.15)';
    text = 'var(--loss)';
  } else if (value < -0.4) {
    bg = 'rgba(239,68,68,0.07)';
    text = 'var(--loss)';
  }

  return (
    <div
      className="w-full aspect-square rounded flex items-center justify-center text-[10px] font-mono font-bold tabular-nums transition-colors"
      style={{ backgroundColor: bg, color: text }}
    >
      {value > 0 ? '+' : ''}{value.toFixed(2)}
    </div>
  );
}

// ─── Collapsible Section Wrapper ──────────────────────────────────────────────

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
  className = '',
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`border-b border-white/[0.06] ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-[var(--forex-muted)]" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MarketOverviewTab() {
  // State
  const [localPrices, setLocalPrices] = useState(basePairs);
  const [sentimentValue, setSentimentValue] = useState(62);
  const [volatility, setVolatility] = useState(38.5);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [indices, setIndices] = useState(indicesData);
  const [commodities, setCommodities] = useState(commoditiesData);
  const [sessions] = useState<SessionInfo[]>(getSessions);
  const posCalc = usePositionCalc();

  // Session clocks status (compact bar)
  const sessionClocks = useMemo(() => {
    const now = new Date();
    const utcH = now.getUTCHours();

    const isOpen = (open: number, close: number) => {
      if (open < close) return utcH >= open && utcH < close;
      return utcH >= open || utcH < close;
    };

    return [
      { name: 'Sydney', open: isOpen(21, 6), range: '21:00-06:00 UTC' },
      { name: 'Tokyo', open: isOpen(0, 9), range: '00:00-09:00 UTC' },
      { name: 'London', open: isOpen(7, 16), range: '07:00-16:00 UTC' },
      { name: 'New York', open: isOpen(12, 21), range: '12:00-21:00 UTC' },
    ];
  }, []);

  // Store
  const storePrices = useForexStore((s) => s.livePrices);
  const socketConnected = useForexStore((s) => s.socketConnected);

  const livePrices = socketConnected && storePrices.length > 0 ? storePrices : localPrices;

  // Auto-refresh simulation every 5 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setIsRefreshing(true);

      // Jitter prices
      setLocalPrices((prev) =>
        prev.map((p) => {
          const jpy = p.pair.includes('JPY');
          const jitter = jpy ? (Math.random() - 0.5) * 0.06 : (Math.random() - 0.5) * 0.0004;
          const newBid = +(p.bid + jitter).toFixed(jpy ? 2 : 4);
          const newAsk = +(newBid + p.spread / 100).toFixed(jpy ? 2 : 4);
          const newChange = +(p.change + jitter).toFixed(jpy ? 3 : 6);
          const newChangePercent = +(newChange / p.bid * 10000).toFixed(2);
          const newHigh = p.high + (Math.random() - 0.5) * 0.0002;
          const newLow = p.low - (Math.random() - 0.5) * 0.0002;
          return {
            ...p,
            bid: newBid,
            ask: newAsk,
            change: newChange,
            changePercent: newChangePercent,
            high: jpy ? +newHigh.toFixed(2) : +newHigh.toFixed(4),
            low: jpy ? +newLow.toFixed(2) : +newLow.toFixed(4),
          };
        })
      );

      // Jitter sentiment
      setSentimentValue((prev) => {
        const delta = (Math.random() - 0.45) * 3;
        return Math.min(85, Math.max(20, prev + delta));
      });

      // Jitter volatility
      setVolatility((prev) => {
        const delta = (Math.random() - 0.5) * 2;
        return Math.min(95, Math.max(10, prev + delta));
      });

      // Jitter indices
      setIndices((prev) =>
        prev.map((idx) => {
          const jitter = (Math.random() - 0.5) * idx.value * 0.0003;
          const newVal = +(idx.value + jitter).toFixed(2);
          const newChange = +(idx.change + jitter).toFixed(2);
          const newChangePercent = +(newChange / idx.value * 100).toFixed(2);
          return { ...idx, value: newVal, change: newChange, changePercent: newChangePercent };
        })
      );

      // Jitter commodities
      setCommodities((prev) =>
        prev.map((c) => {
          const jitter = (Math.random() - 0.5) * c.price * 0.0004;
          const newPrice = +(c.price + jitter).toFixed(2);
          const newChange = +(c.change + jitter).toFixed(2);
          const newChangePercent = +(newChange / c.price * 100).toFixed(2);
          return { ...c, price: newPrice, change: newChange, changePercent: newChangePercent };
        })
      );

      setLastRefresh(Date.now());

      setTimeout(() => setIsRefreshing(false), 600);
    }, 5000);

    return () => clearInterval(id);
  }, []);

  const formatTimeAgo = useCallback(() => {
    const diff = Math.floor((Date.now() - lastRefresh) / 1000);
    if (diff < 5) return 'Just now';
    return `${diff}s ago`;
  }, [lastRefresh]);

  // Re-render timer for "time ago"
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Correlation matrix data for grid
  const pairNames = useMemo(() => ['EUR/USD', 'GBP/USD', 'AUD/USD', 'NZD/USD', 'USD/CHF', 'USD/JPY', 'USD/CAD'], []);
  const corrGrid = useMemo(() => {
    const grid: (number | null)[][] = [];
    for (let i = 0; i < pairNames.length; i++) {
      const row: (number | null)[] = [];
      for (let j = 0; j < pairNames.length; j++) {
        if (i === j) {
          row.push(1);
        } else {
          const entry = correlationMatrix.find(
            (c) =>
              (c.pair1 === pairNames[i] && c.pair2 === pairNames[j]) ||
              (c.pair1 === pairNames[j] && c.pair2 === pairNames[i])
          );
          row.push(entry?.value ?? null);
        }
      }
      grid.push(row);
    }
    return grid;
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[var(--forex-accent)]" />
            <span className="text-sm font-semibold">Market Overview</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Position Calculator */}
            <LiquidGlass>
              <button
                onClick={posCalc.open}
                className="btn-3d flex items-center gap-1 px-2 py-1 rounded-lg glass text-[10px] font-semibold text-[var(--forex-muted)] hover:text-[var(--forex-accent)] transition-colors"
              >
                <Calculator className="w-3 h-3" />
                <span className="hidden sm:inline">Calc</span>
              </button>
            </LiquidGlass>
            {/* Live indicator */}
            <div className="flex items-center gap-1">
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                animate={socketConnected ? { backgroundColor: ['var(--profit)', '#72c69d', 'var(--profit)'] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                style={!socketConnected ? { backgroundColor: 'var(--forex-muted)' } : {}}
              />
              <span className="text-[9px] text-[var(--forex-muted)] font-medium">LIVE</span>
            </div>
            {/* Last updated */}
            <span className="text-[9px] font-mono text-[var(--forex-muted)]">{formatTimeAgo()}</span>
            {/* Refresh button */}
            <LiquidGlass>
              <button className="btn-3d p-1.5 rounded-lg glass">
                <motion.div
                  animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                  transition={isRefreshing ? { duration: 0.6, ease: 'easeInOut' } : {}}
                >
                  <RefreshCw className="w-3 h-3 text-[var(--forex-muted)]" />
                </motion.div>
              </button>
            </LiquidGlass>
          </div>
        </div>
      </div>

      {/* ─── Scrollable Content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto forex-scrollbar">
        {/* ─── Market Session Clocks ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="px-4 py-2.5 border-b border-white/[0.06]"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-[var(--forex-accent)]" />
            <span className="text-[10px] font-semibold text-[var(--forex-muted)] uppercase tracking-wider">Market Sessions</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {sessionClocks.map((s) => (
              <div key={s.name} className={`session-clock ${s.open ? 'session-clock-open' : 'session-clock-closed'}`}>
                <div className="flex items-center gap-1.5">
                  <span className="session-dot" />
                  <span className="text-[11px] font-semibold">{s.name}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[9px] font-mono opacity-70">{s.range}</span>
                  <span className="text-[10px] font-bold">{s.open ? 'Open' : 'Closed'}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Currency Strength Meter ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="px-4 py-2.5 border-b border-white/[0.06]"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Globe className="w-3.5 h-3.5 text-[var(--forex-accent)]" />
            <span className="text-[10px] font-semibold text-[var(--forex-muted)] uppercase tracking-wider">Currency Strength</span>
          </div>
          <div className="glass rounded-xl p-3 flex justify-center">
            <CurrencyStrengthMeter size={160} />
          </div>
        </motion.div>

        {/* ─── 1. Market Sentiment Gauge ─────────────────────────────────────── */}
        <CollapsibleSection
          title="Market Sentiment"
          icon={<Activity className="w-4 h-4 text-[var(--forex-accent)]" />}
          className=""
        >
          <div className="glass rounded-xl p-4 card-depth-1">
            <div className="flex items-start justify-center">
              <SentimentGauge value={sentimentValue} />
            </div>
            <div className="glow-divider my-3" />
            <div className="grid grid-cols-3 gap-2">
              <div className="mini-stat glass-subtle rounded-lg p-2 text-center">
                <div className="mini-stat-label text-[9px] text-[var(--forex-muted)] mb-0.5 uppercase tracking-wider">Bullish Pairs</div>
                <div className="mini-stat-value text-sm font-bold text-[var(--profit)] tabular-nums">
                  {localPrices.filter((p) => p.change > 0).length}
                </div>
              </div>
              <div className="mini-stat glass-subtle rounded-lg p-2 text-center">
                <div className="mini-stat-label text-[9px] text-[var(--forex-muted)] mb-0.5 uppercase tracking-wider">Bearish Pairs</div>
                <div className="mini-stat-value text-sm font-bold text-[var(--loss)] tabular-nums">
                  {localPrices.filter((p) => p.change < 0).length}
                </div>
              </div>
              <div className="mini-stat glass-subtle rounded-lg p-2 text-center">
                <div className="mini-stat-label text-[9px] text-[var(--forex-muted)] mb-0.5 uppercase tracking-wider">Neutral</div>
                <div className="mini-stat-value text-sm font-bold text-[var(--gold)] tabular-nums">
                  {localPrices.filter((p) => Math.abs(p.changePercent) < 0.08).length}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* ─── 6. Volatility Index ──────────────────────────────────────────── */}
        <CollapsibleSection
          title="Volatility Index"
          icon={<Gauge className="w-4 h-4 text-[var(--gold)]" />}
          className=""
        >
          <div className="glass rounded-xl p-4 card-depth-1">
            <VolatilityBar value={volatility} />
          </div>
        </CollapsibleSection>

        {/* ─── 2. Major Pairs Grid ──────────────────────────────────────────── */}
        <CollapsibleSection
          title="Major Pairs"
          icon={<BarChart3 className="w-4 h-4 text-[var(--forex-accent)]" />}
          defaultOpen={true}
          className=""
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <AnimatePresence>
              {livePrices.map((pair, idx) => {
                const positive = pair.change >= 0;
                const jpy = pair.pair.includes('JPY');
                return (
                  <motion.div
                    key={pair.pair}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="glass rounded-xl p-3 card-depth-1 glass-prismatic noise-overlay"
                  >
                    <LiquidGlass>
                      <div className="space-y-2">
                        {/* Pair header + sparkline */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[13px] font-bold">{pair.pair}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              {positive ? (
                                <ArrowUpRight className="w-3 h-3 text-[var(--profit)]" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3 text-[var(--loss)]" />
                              )}
                              <span
                                className={`text-[11px] font-semibold font-mono tabular-nums ${
                                  positive ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
                                }`}
                              >
                                {positive ? '+' : ''}
                                {jpy ? pair.change.toFixed(2) : pair.change.toFixed(4)}
                              </span>
                              <span
                                className={`text-[10px] font-bold font-mono tabular-nums ${
                                  positive ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
                                }`}
                              >
                                ({positive ? '+' : ''}
                                {pair.changePercent.toFixed(2)}%)
                              </span>
                            </div>
                          </div>
                          <MiniSparkline positive={positive} seed={idx * 13} />
                        </div>

                        <div className="glow-line" />

                        {/* Bid / Ask */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-[8px] text-[var(--forex-muted)] uppercase tracking-wider mb-0.5">Bid</div>
                            <div className="text-[13px] font-mono font-bold tabular-nums text-[var(--forex-text)]">
                              {formatPrice(pair.bid, pair.pair)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[8px] text-[var(--forex-muted)] uppercase tracking-wider mb-0.5">Ask</div>
                            <div className="text-[13px] font-mono font-bold tabular-nums text-[var(--forex-text)]">
                              {formatPrice(pair.ask, pair.pair)}
                            </div>
                          </div>
                        </div>

                        {/* Spread */}
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-[var(--forex-muted)]">Spread</span>
                          <span className="text-[10px] font-mono font-semibold text-[var(--forex-text)] tabular-nums">
                            {pair.spread.toFixed(1)} pips
                          </span>
                        </div>

                        {/* High / Low */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="glass-subtle rounded px-2 py-1">
                            <div className="text-[8px] text-[var(--forex-muted)] uppercase tracking-wider">High</div>
                            <div className="text-[11px] font-mono font-bold text-[var(--profit)] tabular-nums">
                              {formatPrice(pair.high, pair.pair)}
                            </div>
                          </div>
                          <div className="glass-subtle rounded px-2 py-1">
                            <div className="text-[8px] text-[var(--forex-muted)] uppercase tracking-wider">Low</div>
                            <div className="text-[11px] font-mono font-bold text-[var(--loss)] tabular-nums">
                              {formatPrice(pair.low, pair.pair)}
                            </div>
                          </div>
                        </div>

                        {/* Buy / Sell buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="btn-3d rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--profit)]/15 text-[var(--profit)] border border-[var(--profit)]/20 hover:bg-[var(--profit)]/25 transition-colors"
                          >
                            Buy
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="btn-3d rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--loss)]/15 text-[var(--loss)] border border-[var(--loss)]/20 hover:bg-[var(--loss)]/25 transition-colors"
                          >
                            Sell
                          </motion.button>
                        </div>
                      </div>
                    </LiquidGlass>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </CollapsibleSection>

        {/* ─── 3. Market Indices ────────────────────────────────────────────── */}
        <CollapsibleSection
          title="Market Indices"
          icon={<BarChart3 className="w-4 h-4 text-[var(--gold)]" />}
          defaultOpen={true}
          className=""
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {indices.map((idx) => {
              const positive = idx.change >= 0;
              return (
                <motion.div
                  key={idx.name}
                  whileHover={{ scale: 1.02 }}
                  className="glass rounded-xl p-3 card-depth-1"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-bold">{idx.name}</span>
                    {positive ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-[var(--profit)]" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 text-[var(--loss)]" />
                    )}
                  </div>
                  <div className="text-[14px] font-mono font-bold tabular-nums text-[var(--forex-text)] mb-0.5">
                    {idx.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span
                    className={`text-[10px] font-mono font-semibold tabular-nums ${
                      positive ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
                    }`}
                  >
                    {positive ? '+' : ''}
                    {idx.change.toFixed(2)} ({positive ? '+' : ''}
                    {idx.changePercent.toFixed(2)}%)
                  </span>
                </motion.div>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* ─── 4. Commodities ───────────────────────────────────────────────── */}
        <CollapsibleSection
          title="Commodities"
          icon={<Coins className="w-4 h-4 text-[var(--gold)]" />}
          defaultOpen={true}
          className=""
        >
          <div className="grid grid-cols-2 gap-2">
            {commodities.map((c) => {
              const positive = c.change >= 0;
              return (
                <motion.div
                  key={c.name}
                  whileHover={{ scale: 1.02 }}
                  className="glass rounded-xl p-3 card-depth-1"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">{c.icon}</span>
                    <div className="flex-1">
                      <span className="text-[12px] font-bold">{c.name}</span>
                      <div className="text-[8px] text-[var(--forex-muted)] font-mono">{c.unit}</div>
                    </div>
                    {positive ? (
                      <TrendingUp className="w-3.5 h-3.5 text-[var(--profit)]" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-[var(--loss)]" />
                    )}
                  </div>
                  <div className="text-[15px] font-mono font-bold tabular-nums text-[var(--forex-text)] mb-0.5">
                    ${c.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span
                    className={`text-[10px] font-mono font-semibold tabular-nums ${
                      positive ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
                    }`}
                  >
                    {positive ? '+' : ''}
                    {c.change.toFixed(2)} ({positive ? '+' : ''}
                    {c.changePercent.toFixed(2)}%)
                  </span>
                </motion.div>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* ─── 5. Session Status Panel ──────────────────────────────────────── */}
        <CollapsibleSection
          title="Trading Sessions"
          icon={<Globe className="w-4 h-4 text-[var(--forex-accent)]" />}
          defaultOpen={true}
          className=""
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sessions.map((session) => {
              const isOpen = session.status === 'open' || session.status === 'overlapping';
              const isOverlapping = session.status === 'overlapping';
              const dotColor = isOverlapping ? 'var(--gold)' : isOpen ? 'var(--profit)' : 'var(--forex-muted)';
              const statusLabel = isOverlapping ? 'Overlap' : session.status === 'open' ? 'Open' : session.status === 'pre-market' ? 'Pre' : 'Closed';
              return (
                <motion.div
                  key={session.name}
                  whileHover={{ scale: 1.01 }}
                  className="glass rounded-xl p-3 card-depth-1"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <CircleDot className="w-4 h-4" style={{ color: dotColor }} />
                        {(isOpen || isOverlapping) && (
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{ border: `1.5px solid ${dotColor}` }}
                            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                      </div>
                      <div>
                        <span className="text-[12px] font-bold">{session.name}</span>
                        <span className="text-[9px] text-[var(--forex-muted)] ml-1.5 font-mono">{session.city}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isOverlapping
                          ? 'bg-[var(--gold)]/15 text-[var(--gold)]'
                          : isOpen
                          ? 'bg-[var(--profit)]/15 text-[var(--profit)]'
                          : 'bg-white/[0.04] text-[var(--forex-muted)]'
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-[var(--forex-muted)] mb-1.5 font-mono">
                    <span>{session.openTime} – {session.closeTime} UTC</span>
                  </div>
                  <div className="glass-subtle rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[8px] text-[var(--forex-muted)] uppercase tracking-wider">Range</div>
                        <div className="text-[10px] font-mono font-semibold text-[var(--forex-text)]">
                          {session.rangeLow.toFixed(session.name === 'Tokyo' ? 2 : 4)} – {session.rangeHigh.toFixed(session.name === 'Tokyo' ? 2 : 4)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[8px] text-[var(--forex-muted)] uppercase tracking-wider">Pips</div>
                        <div className="text-[11px] font-mono font-bold text-[var(--forex-accent)]">{session.rangePips}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* ─── 7. Correlation Matrix ────────────────────────────────────────── */}
        <CollapsibleSection
          title="Correlation Matrix"
          icon={<Activity className="w-4 h-4 text-[var(--forex-accent)]" />}
          defaultOpen={false}
          className=""
        >
          <div className="glass rounded-xl p-3 card-depth-1 overflow-x-auto">
            {/* Legend */}
            <div className="flex items-center gap-3 mb-3 text-[9px]">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-[var(--profit)]/15 border border-[var(--profit)]/20" />
                <span className="text-[var(--forex-muted)]">Strong +</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-[var(--loss)]/15 border border-[var(--loss)]/20" />
                <span className="text-[var(--forex-muted)]">Strong −</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-white/[0.04]" />
                <span className="text-[var(--forex-muted)]">Weak</span>
              </div>
            </div>

            {/* Matrix */}
            <div className="min-w-[320px]">
              {/* Header row */}
              <div className="grid gap-[2px] mb-[2px]" style={{ gridTemplateColumns: `72px repeat(${pairNames.length}, 1fr)` }}>
                <div />
                {pairNames.map((name) => (
                  <div
                    key={name}
                    className="text-[7px] font-bold text-[var(--forex-muted)] text-center truncate px-0.5"
                    title={name}
                  >
                    {name.replace('/', '/\u200B')}
                  </div>
                ))}
              </div>
              {/* Data rows */}
              {pairNames.map((rowName, i) => (
                <div key={rowName} className="grid gap-[2px] mb-[2px]" style={{ gridTemplateColumns: `72px repeat(${pairNames.length}, 1fr)` }}>
                  <div className="text-[8px] font-bold text-[var(--forex-text)] flex items-center pr-1 truncate" title={rowName}>
                    {rowName.replace('/', '/\u200B')}
                  </div>
                  {corrGrid[i]?.map((val, j) => (
                    <CorrelationCell key={`${i}-${j}`} value={val ?? 0} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>

        {/* ─── 8. Compact Correlation Heatmap ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="px-4 py-2.5 border-b border-white/[0.06]"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Globe className="w-3.5 h-3.5 text-[var(--forex-accent)]" />
            <span className="text-[10px] font-semibold text-[var(--forex-muted)] uppercase tracking-wider">Correlation Matrix</span>
          </div>
          <div className="glass rounded-xl p-3 card-depth-1">
            <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: `68px repeat(4, 1fr)` }}>
              {/* Header row */}
              <div />
              {['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'].map((p) => (
                <div key={p} className="text-[7px] font-bold text-[var(--forex-muted)] text-center truncate px-0.5">
                  {p.replace('/', '/\u200B')}
                </div>
              ))}
              {/* Data rows */}
              {[
                { pair: 'EUR/USD', vals: [1.00, 0.85, -0.42, 0.72] },
                { pair: 'GBP/USD', vals: [0.85, 1.00, -0.35, 0.62] },
                { pair: 'USD/JPY', vals: [-0.42, -0.35, 1.00, -0.38] },
                { pair: 'AUD/USD', vals: [0.72, 0.62, -0.38, 1.00] },
              ].map((row, i) => (
                <Fragment key={row.pair}>
                  <div className="text-[8px] font-bold text-[var(--forex-text)] flex items-center pr-1 truncate">
                    {row.pair.replace('/', '/\u200B')}
                  </div>
                  {row.vals.map((val, j) => {
                    const isDiag = i === j;
                    let bg = 'rgba(255,255,255,0.04)';
                    if (!isDiag) {
                      if (val > 0.7) bg = `rgba(114,198,157,${val * 0.15})`;
                      else if (val >= 0.3) bg = `rgba(114,198,157,${val * 0.08})`;
                      else if (val < -0.3) bg = `rgba(220,80,60,${Math.abs(val) * 0.12})`;
                    }
                    return (
                      <div
                        key={j}
                        className={`corr-cell ${isDiag ? 'corr-cell-diagonal' : ''}`}
                        style={isDiag ? undefined : { backgroundColor: bg }}
                      >
                        {isDiag ? '1.00' : (val > 0 ? '+' : '') + val.toFixed(2)}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>
      {/* Position Size Calculator Modal */}
      <PositionSizeCalculator isOpen={posCalc.isOpen} onClose={posCalc.close} />
    </div>
  );
}