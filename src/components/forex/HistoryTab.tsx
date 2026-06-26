'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  DollarSign,
  Target,
  BarChart3,
  Trophy,
  Filter,
  ChevronDown,
  ChevronUp,
  Flame,
  Award,
  Percent,
  PenLine,
  FileText,
  AlertTriangle,
  Activity,
  TrendingDown,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { TradeHistory } from '@/types/forex';
import LiquidGlass from './LiquidGlass';
import { TradeJournalModal, useTradeJournal } from './TradeJournalModal';

const trades: TradeHistory[] = [
  { id: 't1', pair: 'EUR/USD', direction: 'BUY', entryPrice: 1.0820, exitPrice: 1.0865, stopLoss: 1.0790, takeProfit: 1.0870, lotSize: 0.5, profit: 225.00, pips: 45, status: 'closed', timeframe: 'H1', openedAt: new Date(Date.now() - 86400000).toISOString(), closedAt: new Date(Date.now() - 43200000).toISOString() },
  { id: 't2', pair: 'GBP/USD', direction: 'SELL', entryPrice: 1.2750, exitPrice: 1.2710, stopLoss: 1.2790, takeProfit: 1.2700, lotSize: 0.3, profit: 120.00, pips: 40, status: 'closed', timeframe: 'H4', openedAt: new Date(Date.now() - 172800000).toISOString(), closedAt: new Date(Date.now() - 129600000).toISOString() },
  { id: 't3', pair: 'USD/JPY', direction: 'BUY', entryPrice: 156.80, exitPrice: 157.20, stopLoss: 156.40, takeProfit: 157.50, lotSize: 0.2, profit: 80.00, pips: 40, status: 'closed', timeframe: 'D1', openedAt: new Date(Date.now() - 259200000).toISOString(), closedAt: new Date(Date.now() - 216000000).toISOString() },
  { id: 't4', pair: 'AUD/USD', direction: 'BUY', entryPrice: 0.6510, exitPrice: 0.6495, stopLoss: 0.6480, takeProfit: 0.6550, lotSize: 0.4, profit: -60.00, pips: -15, status: 'closed', timeframe: 'M15', openedAt: new Date(Date.now() - 345600000).toISOString(), closedAt: new Date(Date.now() - 302400000).toISOString() },
  { id: 't5', pair: 'USD/CAD', direction: 'SELL', entryPrice: 1.3660, exitPrice: 1.3620, stopLoss: 1.3700, takeProfit: 1.3600, lotSize: 0.35, profit: 140.00, pips: 40, status: 'closed', timeframe: 'H1', openedAt: new Date(Date.now() - 432000000).toISOString(), closedAt: new Date(Date.now() - 388800000).toISOString() },
  { id: 't6', pair: 'EUR/GBP', direction: 'BUY', entryPrice: 0.8510, exitPrice: 0.8540, stopLoss: 0.8485, takeProfit: 0.8560, lotSize: 0.25, profit: 75.00, pips: 30, status: 'closed', timeframe: 'H4', openedAt: new Date(Date.now() - 518400000).toISOString(), closedAt: new Date(Date.now() - 475200000).toISOString() },
  { id: 't7', pair: 'NZD/USD', direction: 'SELL', entryPrice: 0.6000, exitPrice: 0.6025, stopLoss: 0.6040, takeProfit: 0.5960, lotSize: 0.3, profit: -75.00, pips: -25, status: 'closed', timeframe: 'H1', openedAt: new Date(Date.now() - 604800000).toISOString(), closedAt: new Date(Date.now() - 561600000).toISOString() },
  { id: 't8', pair: 'EUR/USD', direction: 'BUY', entryPrice: 1.0840, exitPrice: 1.0890, stopLoss: 1.0810, takeProfit: 1.0900, lotSize: 0.6, profit: 300.00, pips: 50, status: 'closed', timeframe: 'D1', openedAt: new Date(Date.now() - 691200000).toISOString(), closedAt: new Date(Date.now() - 648000000).toISOString() },
  { id: 't9', pair: 'GBP/JPY', direction: 'BUY', entryPrice: 200.10, exitPrice: 200.85, stopLoss: 199.60, takeProfit: 201.50, lotSize: 0.15, profit: 112.50, pips: 75, status: 'closed', timeframe: 'H1', openedAt: new Date(Date.now() - 768960000).toISOString(), closedAt: new Date(Date.now() - 725760000).toISOString() },
  { id: 't10', pair: 'USD/CHF', direction: 'SELL', entryPrice: 0.8850, exitPrice: 0.8875, stopLoss: 0.8820, takeProfit: 0.8800, lotSize: 0.4, profit: -100.00, pips: -25, status: 'closed', timeframe: 'H4', openedAt: new Date(Date.now() - 846720000).toISOString(), closedAt: new Date(Date.now() - 803520000).toISOString() },
];

function formatPrice(price: number, pair: string) {
  const decimals = pair.includes('JPY') ? 2 : 4;
  return price.toFixed(decimals);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

const winTrades = trades.filter(t => t.profit > 0);
const lossTrades = trades.filter(t => t.profit < 0);

const stats = {
  totalTrades: trades.length,
  winCount: winTrades.length,
  lossCount: lossTrades.length,
  winRate: Math.round(winTrades.length / trades.length * 100),
  totalProfit: trades.reduce((sum, t) => sum + t.profit, 0),
  totalPips: trades.reduce((sum, t) => sum + t.pips, 0),
  bestTrade: Math.max(...trades.map(t => t.profit)),
  worstTrade: Math.min(...trades.map(t => t.profit)),
  avgRR: 1.8,
  profitFactor: 2.15,
  sharpeRatio: 1.42,
  maxDrawdown: -3.2,
  streak: 4,
  avgWin: winTrades.length > 0 ? winTrades.reduce((s, t) => s + t.profit, 0) / winTrades.length : 0,
  avgLoss: lossTrades.length > 0 ? Math.abs(lossTrades.reduce((s, t) => s + t.profit, 0) / lossTrades.length) : 0,
};

const monthlyData = [
  { month: 'Oct 2024', pl: 520, winRate: 72, trades: 18 },
  { month: 'Sep 2024', pl: -180, winRate: 45, trades: 20 },
  { month: 'Aug 2024', pl: 740, winRate: 80, trades: 15 },
  { month: 'Jul 2024', pl: 310, winRate: 65, trades: 17 },
  { month: 'Jun 2024', pl: -95, winRate: 50, trades: 14 },
  { month: 'May 2024', pl: 425, winRate: 68, trades: 19 },
];

// Simulated equity curve data (30 points, generally trending up with dips)
const sparklineEquityData = [
  100, 108, 95, 118, 110, 130, 122, 145, 135, 155,
  148, 165, 155, 178, 170, 195, 182, 210, 200, 225,
  215, 238, 228, 252, 242, 265, 255, 278, 268, 295,
];

function EquitySparkline() {
  const data = sparklineEquityData;
  const svgWidth = 200;
  const svgHeight = 40;
  const padY = 3;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * svgWidth;
    const y = svgHeight - padY - ((v - min) / range) * (svgHeight - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePath = points.join(' ');
  const fillPath = `0,${svgHeight} ${linePath} ${svgWidth},${svgHeight}`;

  // Approximate polyline length for dash animation
  let approxLen = 0;
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i - 1].split(',').map(Number);
    const [x2, y2] = points[i].split(',').map(Number);
    approxLen += Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-8" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--profit)" stopOpacity={0.3} />
          <stop offset="100%" stopColor="var(--profit)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={fillPath} fill="url(#sparkGrad)" />
      <motion.polyline
        points={linePath}
        fill="none"
        stroke="var(--profit)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={approxLen}
        initial={{ strokeDashoffset: approxLen }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.2 }}
      />
    </svg>
  );
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { label: string } }> }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="glass-strong rounded-lg px-2.5 py-1.5 text-[10px] card-depth-2">
      <div className="text-[var(--forex-muted)]">{payload[0].payload.label}</div>
      <div className={`font-mono font-bold ${value >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
        {value >= 0 ? '+' : ''}{value.toFixed(2)}
      </div>
    </div>
  );
}

// Stat card definitions for the enhanced grid
const statCardDefs = [
  { label: 'Win Rate', value: `${stats.winRate}%`, icon: Trophy, color: 'text-[var(--profit)]', iconColor: 'text-[var(--gold)]', glow: 'stat-glow-green breathe-glow', shine: true },
  { label: 'Net Profit', value: `${stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(2)}`, icon: DollarSign, color: stats.totalProfit >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]', iconColor: 'text-[var(--gold)]', glow: 'stat-glow-gold', shine: true },
  { label: 'Total Trades', value: `${stats.totalTrades}`, icon: Target, color: 'text-[var(--forex-text)]', iconColor: 'text-[var(--forex-accent)]', glow: 'card-depth-1', shine: false },
  { label: 'Total Pips', value: `${stats.totalPips >= 0 ? '+' : ''}${stats.totalPips}`, icon: TrendingUp, color: stats.totalPips >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]', iconColor: 'text-[var(--forex-accent)]', glow: 'card-depth-1', shine: false },
  { label: 'Best Trade', value: '+$300.00', icon: Award, color: 'text-[var(--profit)]', iconColor: 'text-[var(--profit)]', glow: 'stat-glow-green', shine: true },
  { label: 'Worst Trade', value: '-$100.00', icon: AlertTriangle, color: 'text-[var(--loss)]', iconColor: 'text-[var(--loss)]', glow: 'stat-glow-red', shine: false },
  { label: 'Avg Win', value: `+$${stats.avgWin.toFixed(0)}`, icon: ArrowUpRight, color: 'text-[var(--profit)]', iconColor: 'text-[var(--profit)]', glow: '', shine: false },
  { label: 'Avg Loss', value: `-$${stats.avgLoss.toFixed(0)}`, icon: ArrowDownRight, color: 'text-[var(--loss)]', iconColor: 'text-[var(--loss)]', glow: '', shine: false },
  { label: 'Profit Factor', value: '2.15', icon: Percent, color: 'text-[var(--gold)]', iconColor: 'text-[var(--gold)]', glow: 'stat-glow-gold', shine: true },
  { label: 'Sharpe Ratio', value: '1.42', icon: Activity, color: 'text-[var(--forex-accent)]', iconColor: 'text-[var(--forex-accent)]', glow: '', shine: false },
  { label: 'Max Drawdown', value: '-3.2%', icon: TrendingDown, color: 'text-[var(--loss)]', iconColor: 'text-[var(--loss)]', glow: '', shine: false },
  { label: 'Win Streak', value: `${stats.streak}`, icon: Flame, color: 'text-[var(--gold)]', iconColor: 'text-[var(--gold)]', glow: '', shine: false },
];

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

export default function HistoryTab() {
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'profit' | 'pips'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showStats, setShowStats] = useState(true);
  const [showChart, setShowChart] = useState(true);
  const [tradeNotes, setTradeNotes] = useState<Record<string, string>>({});
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [showMonthly, setShowMonthly] = useState(false);
  const journal = useTradeJournal();

  const sortedTrades = useMemo(() => [...trades].sort((a, b) => {
    const dir = sortDir === 'desc' ? -1 : 1;
    if (sortBy === 'date') return dir * (new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime());
    if (sortBy === 'profit') return dir * (a.profit - b.profit);
    return dir * (a.pips - b.pips);
  }), [sortBy, sortDir]);

  const equityData = useMemo(() => {
    const sorted = [...trades].sort((a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime());
    const data: { label: string; equity: number; trade: number }[] = [];
    let running = 0;
    for (let i = 0; i < sorted.length; i++) {
      running += sorted[i].profit;
      data.push({
        label: `#${i + 1}`,
        equity: +running.toFixed(2),
        trade: sorted[i].profit,
      });
    }
    return data;
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Performance Stats */}
      <div className="px-4 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[var(--forex-accent)]" />
            <span className="text-sm font-semibold">Performance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <LiquidGlass>
              <button
                onClick={() => journal.open()}
                className="btn-3d flex items-center gap-1 px-2 py-1.5 rounded-lg glass text-[var(--gold)]"
                title="Trade Journal"
              >
                <PenLine className="w-3 h-3" />
                <span className="text-[9px] font-semibold hidden sm:inline">Journal</span>
              </button>
            </LiquidGlass>
            <LiquidGlass>
              <button
                onClick={() => setShowChart(!showChart)}
                className={`btn-3d p-1.5 rounded-lg ${showChart ? 'glass' : 'glass-subtle'}`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-[var(--forex-muted)]" />
              </button>
            </LiquidGlass>
            <LiquidGlass>
              <button
                onClick={() => setShowStats(!showStats)}
                className="btn-3d p-1.5 rounded-lg glass"
              >
                {showStats ? <ChevronUp className="w-3.5 h-3.5 text-[var(--forex-muted)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--forex-muted)]" />}
              </button>
            </LiquidGlass>
          </div>
        </div>

        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {/* Equity curve chart */}
              {showChart && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-2.5"
                >
                  <div className="glass rounded-xl p-3 card-depth-2 shimmer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold">Equity Curve</span>
                      <span className={`text-[11px] font-mono font-bold ${stats.totalProfit >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                        {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-[100px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={equityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--profit)" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="var(--profit)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 8, fill: 'var(--forex-muted)' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 8, fill: 'var(--forex-muted)' }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="equity" stroke="var(--profit)" strokeWidth={1.5} fill="url(#equityGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* P&L Sparkline */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="glass rounded-xl p-3 card-depth-1 mb-2.5 noise-overlay liquid-shine relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-1.5 relative z-[3]">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-[var(--forex-accent)]" />
                    <span className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold">P&L Sparkline</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[var(--profit)]">+195.00</span>
                </div>
                <div className="relative z-[3]">
                  <EquitySparkline />
                </div>
              </motion.div>

              <div className="glow-divider mb-2.5" />

              {/* Performance Breakdown - Win/Loss Bars */}
              <div className="glass rounded-xl p-3 card-depth-1 mb-2.5">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Award className="w-3 h-3 text-[var(--forex-accent)]" />
                  <span className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold">Performance Breakdown</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-[var(--profit)]">Wins ({stats.winCount})</span>
                      <span className="text-[10px] font-bold text-[var(--profit)] tabular-nums">{stats.winRate}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--profit)]/60 to-[var(--profit)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.winRate}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-[var(--loss)]">Losses ({stats.lossCount})</span>
                      <span className="text-[10px] font-bold text-[var(--loss)] tabular-nums">{100 - stats.winRate}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--loss)]/60 to-[var(--loss)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${100 - stats.winRate}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                  <div className="mini-stat">
                    <span className="mini-stat-label">Trades</span>
                    <span className="mini-stat-value">{stats.totalTrades}</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-label">Win Rate</span>
                    <span className="mini-stat-value text-[var(--profit)]">{stats.winRate}%</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-label">Avg Win</span>
                    <span className="mini-stat-value text-[var(--profit)]">${stats.avgWin.toFixed(0)}</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-label">Avg Loss</span>
                    <span className="mini-stat-value text-[var(--loss)]">${stats.avgLoss.toFixed(0)}</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-label">Profit Factor</span>
                    <span className={`mini-stat-value ${
                      stats.profitFactor > 2 ? 'text-[var(--profit)]' :
                      stats.profitFactor > 1 ? 'text-[var(--gold)]' :
                      'text-[var(--loss)]'
                    }`}>{stats.profitFactor.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Stats Grid */}
              <motion.div
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2"
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {statCardDefs.map((card) => {
                  const Icon = card.icon;
                  return (
                    <motion.div key={card.label} variants={cardVariants} transition={{ duration: 0.35, ease: 'easeOut' }}>
                      <div className={`glass ${card.glow} rounded-xl p-2.5 noise-overlay ${card.shine ? 'liquid-shine' : ''} relative overflow-hidden`}>
                        <div className="flex items-center gap-1.5 mb-1 relative z-[3]">
                          <Icon className="w-3 h-3" style={{ color: `var(${card.iconColor.includes('profit') ? '--profit' : card.iconColor.includes('loss') ? '--loss' : card.iconColor.includes('gold') ? '--gold' : '--forex-accent'})` }} />
                          <span className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold">{card.label}</span>
                        </div>
                        <div className={`text-base font-bold tabular-nums relative z-[3] ${card.color}`}>
                          {card.value}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Monthly Performance Summary */}
              <div className="glow-divider my-2.5" />
              <div>
                <button
                  onClick={() => setShowMonthly(!showMonthly)}
                  className="flex items-center gap-1.5 mb-2 w-full"
                >
                  <Calendar className="w-3 h-3 text-[var(--forex-accent)]" />
                  <span className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold">Monthly Performance</span>
                  {showMonthly ? <ChevronUp className="w-3 h-3 text-[var(--forex-muted)] ml-auto" /> : <ChevronDown className="w-3 h-3 text-[var(--forex-muted)] ml-auto" />}
                </button>
                <AnimatePresence>
                  {showMonthly && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="glass rounded-xl p-3 card-depth-1">
                        {monthlyData.map((month, i) => (
                          <div key={month.month}>
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-[10px] font-semibold text-[var(--forex-text)] w-16 shrink-0">{month.month}</span>
                                <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                  <motion.div
                                    className={`h-full rounded-full ${month.pl >= 0 ? 'bg-[var(--profit)]/70' : 'bg-[var(--loss)]/70'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(Math.abs(month.pl) / 800 * 100, 100)}%` }}
                                    transition={{ duration: 0.5, delay: 0.1 + i * 0.06 }}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-bold tabular-nums w-16 text-right ${month.pl >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                                  {month.pl >= 0 ? '+' : ''}{month.pl.toFixed(0)}
                                </span>
                                <span className="text-[9px] text-[var(--forex-muted)] tabular-nums w-10 text-right">{month.winRate}%</span>
                                <span className="text-[9px] text-[var(--forex-muted)] tabular-nums w-6 text-right">{month.trades}</span>
                              </div>
                            </div>
                            {i < monthlyData.length - 1 && <div className="glow-divider" />}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-[var(--forex-muted)]" />
          <span className="text-[10px] text-[var(--forex-muted)] font-medium">Period:</span>
        </div>
        {(['all', 'today', 'week', 'month'] as const).map((f) => (
          <LiquidGlass key={f}>
            <button
              onClick={() => setTimeFilter(f)}
              className={`btn-3d px-2 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider transition-all ${
                timeFilter === f
                  ? 'glass-strong text-[var(--forex-accent)]'
                  : 'glass-subtle text-[var(--forex-muted)] hover:text-[var(--forex-text)]'
              }`}
            >
              {f}
            </button>
          </LiquidGlass>
        ))}
        <div className="flex-1" />
        <div className="flex gap-0.5">
          {(['date', 'profit', 'pips'] as const).map((s) => (
            <LiquidGlass key={s}>
              <button
                onClick={() => {
                  if (sortBy === s) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
                  else { setSortBy(s); setSortDir('desc'); }
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase transition-all ${
                  sortBy === s ? 'text-[var(--forex-accent)] bg-white/[0.06]' : 'text-[var(--forex-muted)]'
                }`}
              >
                {s}{sortBy === s ? (sortDir === 'desc' ? <ChevronDown className="w-2.5 h-2.5 inline" /> : <ChevronUp className="w-2.5 h-2.5 inline" />) : null}
              </button>
            </LiquidGlass>
          ))}
        </div>
      </div>

      {/* Trade List */}
      <div className="flex-1 overflow-y-auto forex-scrollbar px-4 py-2.5 space-y-2">
        {sortedTrades.map((trade, index) => (
          <motion.div
            key={trade.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className="signal-card card-interactive glass-prismatic rounded-xl p-3 noise-overlay"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded flex items-center justify-center card-depth-1 ${
                  trade.direction === 'BUY'
                    ? 'bg-[var(--profit)]/15 text-[var(--profit)]'
                    : 'bg-[var(--loss)]/15 text-[var(--loss)]'
                }`}>
                  {trade.direction === 'BUY' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-bold">{trade.pair}</span>
                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                      trade.direction === 'BUY' ? 'bg-[var(--profit)]/15 text-[var(--profit)]' : 'bg-[var(--loss)]/15 text-[var(--loss)]'
                    }`}>
                      {trade.direction}
                    </span>
                    <span className="text-[8px] text-[var(--forex-muted)] px-1 py-0.5 rounded bg-white/[0.04]">{trade.timeframe}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className={`text-[13px] font-bold counter-animate tabular-nums ${
                  trade.profit >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
                }`}>
                  {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                </div>
                <div className={`text-[9px] font-semibold tabular-nums ${
                  trade.pips >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
                }`}>
                  {trade.pips >= 0 ? '+' : ''}{trade.pips} pips | {trade.lotSize} lot
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <div>
                  <span className="text-[8px] text-[var(--forex-muted)] uppercase">Entry</span>
                  <div className="text-[10px] font-mono tabular-nums">{formatPrice(trade.entryPrice, trade.pair)}</div>
                </div>
                <div>
                  <span className="text-[8px] text-[var(--forex-muted)] uppercase">Exit</span>
                  <div className="text-[10px] font-mono tabular-nums">{formatPrice(trade.exitPrice, trade.pair)}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-[var(--forex-muted)]">
                <Calendar className="w-2.5 h-2.5" />
                {formatDate(trade.openedAt)}
              </div>
              <div className="flex items-center gap-1.5">
                {tradeNotes[trade.id] && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[var(--gold)]/15 text-[var(--gold)]">NOTED</span>
                )}
                <button
                  className="p-1 rounded-md hover:bg-white/[0.06] transition-colors"
                >
                  <BarChart3 className="w-3 h-3 text-[var(--forex-muted)]" />
                </button>
                <button
                  onClick={() => setExpandedNote(expandedNote === trade.id ? null : trade.id)}
                  className="p-1 rounded-md hover:bg-white/[0.06] transition-colors"
                >
                  <PenLine className="w-3 h-3 text-[var(--forex-muted)]" />
                </button>
              </div>
            </div>

            {/* P/L Bar */}
            <div className="mt-2 w-full h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${trade.profit >= 0 ? 'bg-gradient-to-r from-[var(--profit)]/50 to-[var(--profit)]' : 'bg-gradient-to-r from-[var(--loss)]/50 to-[var(--loss)]'}`}
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(Math.abs(trade.profit) / Math.max(Math.abs(stats.bestTrade), Math.abs(stats.worstTrade)) * 100, 100)}%`
                }}
                transition={{ duration: 0.6, delay: 0.15 + index * 0.04 }}
              />
            </div>

            {/* Trade Note */}
            <AnimatePresence>
              {expandedNote === trade.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2">
                    <textarea
                      className="trade-note w-full px-3 py-2 rounded-lg text-xs bg-white/[0.04] border border-white/[0.06] text-[var(--forex-text)] placeholder:text-[var(--forex-muted)]/50 resize-none focus:outline-none focus:border-[var(--forex-accent)]/30"
                      placeholder="Add trade note..."
                      maxLength={200}
                      rows={2}
                      value={tradeNotes[trade.id] || ''}
                      onChange={(e) => setTradeNotes(prev => ({ ...prev, [trade.id]: e.target.value }))}
                    />
                    <div className="text-[8px] text-[var(--forex-muted)]/50 text-right mt-0.5">
                      {(tradeNotes[trade.id] || '').length}/200
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
      <TradeJournalModal isOpen={journal.isOpen} onClose={journal.close} />
    </div>
  );
}