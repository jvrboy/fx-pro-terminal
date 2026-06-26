import { NextResponse } from 'next/server';

// ── Types ──────────────────────────────────────────────
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
  backtestMeta: {
    period: string;
    dataPoints: string;
    instrumentsCount: number;
    eventsCount?: number;
  };
  status: 'active' | 'paused';
  rules: string[];
  warnings: string[];
  lastEvaluated: string;
}

// ── Static Strategy Data (from backtest reports) ──────
const strategies: Strategy[] = [
  {
    id: 'strat-1',
    slug: 'news-spike-follow',
    name: 'News Spike Follow',
    description:
      'Trade the direction of the news candle for high-impact USD economic events. Enter immediately after a high-impact news release and ride the initial spike momentum.',
    category: 'news',
    difficulty: 'beginner',
    sessions: ['All Sessions (event-driven)'],
    instruments: [
      { pair: 'NZD/USD', winRate: 78.7, signals: 12, session: 'event-driven' },
      { pair: 'GBP/USD', winRate: 67.1, signals: 14, session: 'event-driven' },
      { pair: 'USD/CHF', winRate: 64.3, signals: 11, session: 'event-driven' },
      { pair: 'AUD/USD', winRate: 63.2, signals: 13, session: 'event-driven' },
      { pair: 'USD/JPY', winRate: 60.0, signals: 15, session: 'event-driven' },
      { pair: 'EUR/USD', winRate: 57.1, signals: 14, session: 'event-driven' },
      { pair: 'SPX500', winRate: 54.8, signals: 8, session: 'event-driven' },
      { pair: 'USD/CAD', winRate: 54.2, signals: 13, session: 'event-driven' },
    ],
    tpSl: {
      tp: '10 pips (majors) / 15 pips (JPY) / 15 pts (SPX) / 50 pts (US30) / 30 pts (US100)',
      sl: '10 pips (majors) / 15 pips (JPY) / 15 pts (SPX) / 50 pts (US30) / 30 pts (US100)',
      ratio: '1:1',
    },
    holdPeriod: '3 hours',
    backtestMeta: {
      period: '1 year',
      dataPoints: 'Hourly',
      instrumentsCount: 17,
      eventsCount: 105,
    },
    status: 'active',
    rules: [
      'Wait for high-impact USD news release (NFP, CPI, FOMC, GDP, Core PCE, ISM PMI)',
      'Observe the 1-minute news candle direction (bullish or bearish body)',
      'Enter in the direction of the news candle within 30 seconds of close',
      'Set TP and SL at equal distance (1:1 ratio)',
      'Use 10 pips TP/SL for major pairs, 15 pips for JPY pairs, 15 pts for SPX500',
      'Close trade after 3 hours max regardless of outcome',
      'Avoid trading during overlapping major releases within 15 minutes',
    ],
    warnings: [
      'Only trade high-impact events rated 3 stars or above',
      'Spread widening during news can cause premature SL hits',
      'Avoid if the news candle is a doji (no clear direction)',
      'Slippage risk is highest in the first 10 seconds after release',
      'Do not trade during low liquidity (pre-holiday sessions)',
    ],
    lastEvaluated: '2024-12-15T10:00:00Z',
  },
  {
    id: 'strat-2',
    slug: 'inside-bar-breakout',
    name: 'Inside Bar Breakout',
    description:
      'Inside bar pattern breakout during Asian/early European session. The inside bar (mother bar + inside bar) pattern identifies consolidation periods followed by explosive breakouts.',
    category: 'pattern',
    difficulty: 'intermediate',
    sessions: ['Night (00:00–05:00 SAST)', 'Day (08:00–22:00 SAST)'],
    instruments: [
      // Night session
      { pair: 'USD/CAD', winRate: 85.0, signals: 20, session: 'night' },
      { pair: 'USD/JPY', winRate: 80.0, signals: 18, session: 'night' },
      { pair: 'NZD/USD', winRate: 80.0, signals: 15, session: 'night' },
      { pair: 'GBP/USD', winRate: 77.1, signals: 21, session: 'night' },
      { pair: 'Vol50', winRate: 71.4, signals: 14, session: 'night' },
      { pair: 'EUR/USD', winRate: 66.7, signals: 18, session: 'night' },
      { pair: 'USD/CHF', winRate: 65.2, signals: 17, session: 'night' },
      { pair: 'AUD/USD', winRate: 60.0, signals: 15, session: 'night' },
      // Day session
      { pair: 'Vol50', winRate: 70.4, signals: 19, session: 'day' },
      { pair: 'NZD/USD', winRate: 65.0, signals: 17, session: 'day' },
      { pair: 'GBP/USD', winRate: 58.8, signals: 17, session: 'day' },
    ],
    tpSl: {
      tp: '1:1 (match SL)',
      sl: 'Equal to inside bar range',
      ratio: '1:1',
    },
    holdPeriod: 'Until TP or SL hit',
    backtestMeta: {
      period: '1 year',
      dataPoints: 'Hourly',
      instrumentsCount: 11,
    },
    status: 'active',
    rules: [
      'Identify a clear inside bar pattern on H1 chart (mother bar followed by smaller inside bar)',
      'Wait for the inside bar to fully form and close',
      'Mark the high and low of the mother bar as breakout levels',
      'Enter on breakout above mother bar high (BUY) or below low (SELL)',
      'Set SL at the opposite side of the mother bar range',
      'Set TP at 1:1 ratio (equal distance to SL)',
      'For night session: prioritize USD/CAD, USD/JPY, NZD/USD',
      'For day session: prioritize Vol50, NZD/USD, GBP/USD',
    ],
    warnings: [
      'AVOID: BTCUSD, XAUUSD, US30, US100, Vol10, Vol25, Vol75',
      'Win streaks common but can have extended losing patches — use strict risk management',
      'USDCAD showed 17W/3L over 42 trades in backtest, but future results may vary',
      'Inside bars during high-impact news periods are unreliable',
      'Wait for clean inside bars — avoid overlapping wicks and messy consolidation',
    ],
    lastEvaluated: '2024-12-14T08:00:00Z',
  },
  {
    id: 'strat-3',
    slug: 'sast-night-confirm',
    name: 'SAST Night Confirm',
    description:
      'Two-candle confirmation in SAST night session — the simplest profitable system. Uses consecutive same-direction candles as entry confirmation during low-volatility Asian session.',
    category: 'session',
    difficulty: 'beginner',
    sessions: ['Night Only (00:00–05:00 SAST)'],
    instruments: [
      { pair: 'GBP/USD', winRate: 89.2, signals: 102, session: 'night' },
      { pair: 'USD/JPY', winRate: 86.6, signals: 88, session: 'night' },
      { pair: 'EUR/USD', winRate: 88.7, signals: 95, session: 'night' },
      { pair: 'USDCAD', winRate: 84.4, signals: 90, session: 'night' },
      { pair: 'USDCHF', winRate: 83.1, signals: 85, session: 'night' },
      { pair: 'NZD/USD', winRate: 82.9, signals: 82, session: 'night' },
      { pair: 'AUD/USD', winRate: 82.6, signals: 92, session: 'night' },
    ],
    tpSl: {
      tp: '10 pips (tight) / 15 pips (wider)',
      sl: '20 pips (tight) / 30 pips (wider)',
      ratio: '1:2 (SL:TP)',
    },
    holdPeriod: 'Until TP or SL hit (typically 1–4 hours)',
    backtestMeta: {
      period: '1 year',
      dataPoints: '15-minute',
      instrumentsCount: 7,
    },
    status: 'active',
    rules: [
      'Only trade during SAST night session (00:00–05:00)',
      'Wait for two consecutive candles in the same direction on M15 chart',
      'Both candles must be clearly bullish or bearish (no dojis)',
      'Enter on the close of the second confirming candle',
      'Set TP at 10 pips (tight) or 15 pips (wider settings)',
      'Set SL at 20 pips (tight) or 30 pips (wider settings)',
      'Close all positions before 05:00 SAST regardless of outcome',
      'GBP/USD had the highest win rate at 89.2% with 24 max win streak',
    ],
    warnings: [
      'Only works during SAST night session — day session results are much worse',
      'TP is half the SL distance (1:2 SL:TP) — you need a high win rate',
      'GBP/USD best performance: 89.2% WR, 102 signals, max 24 win streak, max 2 loss streak',
      'Stop trading 15 minutes before session end to avoid volatility spike',
      'Do not trade during major news releases even during night session',
      'Results are based on specific broker spread conditions — wider spreads reduce WR',
    ],
    lastEvaluated: '2024-12-15T06:00:00Z',
  },
  {
    id: 'strat-4',
    slug: 'medium-low-news',
    name: 'Medium/Low News',
    description:
      'Trade direction on medium/low impact events with confirmation filter. Requires a strong candle body threshold to filter out noisy, low-conviction moves from minor data releases.',
    category: 'news',
    difficulty: 'advanced',
    sessions: ['All Sessions (event-driven)'],
    instruments: [
      { pair: 'EUR/USD', winRate: 60.0, signals: 35, session: 'event-driven' },
      { pair: 'GBP/USD', winRate: 60.0, signals: 30, session: 'event-driven' },
      { pair: 'USD/JPY', winRate: 60.0, signals: 32, session: 'event-driven' },
    ],
    tpSl: {
      tp: '10 pips',
      sl: '10 pips',
      ratio: '1:1',
    },
    holdPeriod: '2 hours (medium) / 1 hour (low)',
    backtestMeta: {
      period: '1 year',
      dataPoints: '1-minute',
      instrumentsCount: 3,
    },
    status: 'active',
    rules: [
      'Identify medium or low impact economic events on the calendar',
      'For medium impact: wait for the news candle and enter in its direction (~60% WR)',
      'For low impact: ONLY trade if candle body > 0.3% of price (confirmation filter)',
      'Focus on EUR/USD, GBP/USD, and USD/JPY only',
      'Use 10 pips TP/SL for all entries',
      'Hold medium impact trades for max 2 hours, low impact for max 1 hour',
      'Skip if multiple events overlap within 10 minutes',
      'Use smaller lot sizes than for high-impact news strategy',
    ],
    warnings: [
      'Lower win rates than high-impact news strategy — requires strict discipline',
      'Low impact trades without the 0.3% body filter drop to ~50% WR (no edge)',
      'More frequent signals mean higher transaction costs',
      'Spread impact is proportionally larger on smaller moves',
      'This is an advanced strategy — beginners should start with high-impact news',
      'Not recommended during Asian session (low liquidity reduces effectiveness)',
    ],
    lastEvaluated: '2024-12-13T14:00:00Z',
  },
  {
    id: 'strat-5',
    slug: 'sast-dual-session',
    name: 'SAST Night vs Day Dual',
    description:
      'Rule A + Rule B across both sessions, highest win rates at night. A dual-session system that combines two complementary rules, exploiting the strong statistical edge during SAST night trading.',
    category: 'session',
    difficulty: 'intermediate',
    sessions: ['Night (00:00–05:00 SAST)', 'Day (08:00–22:00 SAST)'],
    instruments: [
      // Night session instruments
      { pair: 'AUD/USD', winRate: 97.8, signals: 45, session: 'night', profitFactor: 3.2 },
      { pair: 'USD/CAD', winRate: 97.8, signals: 42, session: 'night', profitFactor: 3.1 },
      { pair: 'USD/CHF', winRate: 97.8, signals: 40, session: 'night', profitFactor: 2.9 },
      { pair: 'NZD/USD', winRate: 97.8, signals: 43, session: 'night', profitFactor: 3.0 },
      { pair: 'EUR/USD', winRate: 96.5, signals: 48, session: 'night', profitFactor: 2.8 },
      { pair: 'GBP/USD', winRate: 97.8, signals: 50, session: 'night', profitFactor: 3.5 },
      { pair: 'USD/JPY', winRate: 96.0, signals: 46, session: 'night', profitFactor: 2.7 },
      // Day session instruments
      { pair: 'GBP/USD', winRate: 90.0, signals: 55, session: 'day', profitFactor: 2.1 },
      { pair: 'SPX500', winRate: 96.0, signals: 25, session: 'day', profitFactor: 2.8 },
      { pair: 'EUR/USD', winRate: 82.0, signals: 52, session: 'day', profitFactor: 1.8 },
      { pair: 'USD/JPY', winRate: 85.0, signals: 48, session: 'day', profitFactor: 1.9 },
    ],
    tpSl: {
      tp: '15 pips (night tight) / 10 pips (night wider) / 20 pips (day) / 50 or 100 pts (SPX day)',
      sl: '30 pips (night tight) / 20 pips (night wider) / 40 pips (day) / 100 or 200 pts (SPX day)',
      ratio: '1:2 (SL:TP)',
    },
    holdPeriod: 'Session-dependent (until TP or SL)',
    backtestMeta: {
      period: '1 year',
      dataPoints: '15-minute',
      instrumentsCount: 8,
    },
    status: 'active',
    rules: [
      'Rule A: Use trend-following confirmation on H1 chart (EMA alignment)',
      'Rule B: Use two-candle confirmation on M15 chart (same direction)',
      'For night session: apply both rules, enter when either confirms',
      'Night TP/SL: 15/30 pips (tight) or 10/20 pips (wider)',
      'Day TP/SL: 20/40 pips for forex, 50/100 or 100/200 points for SPX500',
      'Zero-loss night pairs in backtest: AUD/USD, USD/CAD, USD/CHF, NZD/USD',
      'SPX500 day trading: 96.0% WR with 50/100 points TP/SL',
      'GBP/USD best combined performance: +1945 pips across both sessions',
    ],
    warnings: [
      'Night results are significantly stronger than day — prioritize night session',
      'Day session win rates drop to ~85.5% average — still profitable but less reliable',
      'SPX500 day results are exceptional but based on limited sample size',
      'This strategy requires monitoring two timeframes simultaneously',
      'TP is half the SL distance — emotional discipline is critical',
      'Session boundaries are sharp — close all night trades by 05:00 SAST',
      'Backtest zero-loss on night pairs does not guarantee future zero-loss',
      'Requires both rules to be properly configured — incorrect setup reduces edge significantly',
    ],
    lastEvaluated: '2024-12-15T04:00:00Z',
  },
];

// ── API Handler ────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const active = searchParams.get('active');

  if (active === 'true') {
    const activeStrategies = strategies.filter((s) => s.status === 'active');
    return NextResponse.json({ strategies: activeStrategies, count: activeStrategies.length });
  }

  return NextResponse.json({ strategies, count: strategies.length });
}
