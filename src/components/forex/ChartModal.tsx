'use client';

import { useState, useMemo, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const PAIR_BASES: Record<string, number> = {
  'EUR/USD': 1.0865,
  'GBP/USD': 1.2720,
  'USD/JPY': 149.50,
  'USD/CHF': 0.8830,
  'AUD/USD': 0.6545,
  'USD/CAD': 1.3620,
  'NZD/USD': 0.6125,
  'EUR/GBP': 0.8540,
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateCandles(pair: string, timeframe: string): Candle[] {
  const basePrice = PAIR_BASES[pair] ?? 1.0;
  const isJPY = pair.includes('JPY');
  const pipSize = isJPY ? 0.01 : 0.0001;
  const volatility = pipSize * (8 + seededRandom(hashString(timeframe) + 42) * 12);

  const seed = hashString(pair + timeframe);
  const candles: Candle[] = [];
  let price = basePrice;

  const trendBias = (seededRandom(seed) - 0.5) * 2;

  for (let i = 0; i < 30; i++) {
    const r1 = seededRandom(seed + i * 7 + 1);
    const r2 = seededRandom(seed + i * 13 + 100);
    const r3 = seededRandom(seed + i * 19 + 200);
    const r4 = seededRandom(seed + i * 23 + 300);

    const change = (r1 - 0.5 + trendBias * 0.12) * volatility * 3;
    const open = price;
    const close = open + change;
    const wickUp = r2 * volatility * 2.5;
    const wickDown = r3 * volatility * 2.5;
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;
    const volume = 2000 + r4 * 8000;

    candles.push({ open, high, low, close, volume });
    price = close;
  }

  return candles;
}

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  pair: string;
}

export default function ChartModal({ isOpen, onClose, pair }: ChartModalProps) {
  const [timeframe, setTimeframe] = useState('H1');

  const candles = useMemo(() => generateCandles(pair, timeframe), [pair, timeframe]);

  const lastCandle = candles[candles.length - 1];
  const firstCandle = candles[0];
  const isUp = lastCandle.close >= lastCandle.open;
  const changePercent = ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100;

  const allHighs = candles.map((c) => c.high);
  const allLows = candles.map((c) => c.low);
  const high = Math.max(...allHighs);
  const low = Math.min(...allLows);
  const isJPY = pair.includes('JPY');
  const pipSize = isJPY ? 0.01 : 0.0001;
  const spreadPips = 1.2 + seededRandom(hashString(pair)) * 2.5;
  const spread = spreadPips * pipSize;

  const formatPrice = (p: number) => (isJPY ? p.toFixed(3) : p.toFixed(5));

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) return null;

  const CHART_W = 560;
  const CHART_H = 260;
  const CHART_Y = 10;
  const VOL_H = 70;
  const VOL_Y = CHART_Y + CHART_H + 18;
  const TOTAL_H = VOL_Y + VOL_H + 5;
  const CANDLE_COUNT = 30;
  const SLOT_W = CHART_W / CANDLE_COUNT;
  const BODY_W = Math.max(1, SLOT_W * 0.6);

  const minPrice = low - (high - low) * 0.05;
  const maxPrice = high + (high - low) * 0.05;
  const priceRange = maxPrice - minPrice;
  const maxVol = Math.max(...candles.map((c) => c.volume));

  const priceToY = (p: number) =>
    CHART_Y + CHART_H - ((p - minPrice) / priceRange) * CHART_H;
  const volToH = (v: number) => (v / maxVol) * VOL_H;

  const gridLines: Array<{ price: number; y: number }> = [];
  for (let i = 0; i <= 4; i++) {
    const price = minPrice + (priceRange * i) / 4;
    const y = priceToY(price);
    gridLines.push({ price, y });
  }

  const timeframes = ['M5', 'M15', 'H1', 'H4', 'D1'];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="chart-overlay"
          className="chart-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="chart-modal-sheet glass glass-deep"
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Activity size={16} style={{ color: 'var(--forex-accent)' }} />
                  <h2
                    className="text-sm font-bold tracking-wide"
                    style={{ color: 'var(--forex-text)' }}
                  >
                    {pair}
                  </h2>
                  <span
                    className="text-base font-bold tabular-nums"
                    style={{ color: isUp ? 'var(--profit)' : 'var(--loss)' }}
                  >
                    {formatPrice(lastCandle.close)}
                  </span>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      color: changePercent >= 0 ? 'var(--profit)' : 'var(--loss)',
                      backgroundColor:
                        changePercent >= 0
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(239, 68, 68, 0.12)',
                    }}
                  >
                    {changePercent >= 0 ? (
                      <ArrowUpRight size={9} />
                    ) : (
                      <ArrowDownRight size={9} />
                    )}
                    {changePercent >= 0 ? '+' : ''}
                    {changePercent.toFixed(2)}%
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: 'var(--forex-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Timeframe Selector */}
              <div className="tf-selector flex gap-1.5 mb-3">
                {timeframes.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className="tf-btn px-3 py-1 rounded-md text-[11px] font-semibold transition-all"
                    style={{
                      backgroundColor:
                        timeframe === tf
                          ? 'var(--forex-accent)'
                          : 'rgba(255,255,255,0.04)',
                      color:
                        timeframe === tf ? '#000' : 'var(--forex-muted)',
                      border: `1px solid ${
                        timeframe === tf
                          ? 'var(--forex-accent)'
                          : 'rgba(255,255,255,0.08)'
                      }`,
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* SVG Chart */}
              <div
                className="rounded-lg overflow-hidden"
                style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
              >
                <svg
                  viewBox={`0 0 ${CHART_W} ${TOTAL_H}`}
                  className="w-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Grid lines and price labels */}
                  {gridLines.map((gl, i) => (
                    <g key={i}>
                      <line
                        x1={0}
                        y1={gl.y}
                        x2={CHART_W}
                        y2={gl.y}
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth={0.5}
                      />
                      <text
                        x={CHART_W - 4}
                        y={gl.y - 3}
                        textAnchor="end"
                        fill="rgba(255,255,255,0.25)"
                        fontSize={7}
                        fontFamily="monospace"
                      >
                        {formatPrice(gl.price)}
                      </text>
                    </g>
                  ))}

                  {/* Volume separator line */}
                  <line
                    x1={0}
                    y1={VOL_Y - 6}
                    x2={CHART_W}
                    y2={VOL_Y - 6}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={0.5}
                    strokeDasharray="3,3"
                  />
                  <text
                    x={4}
                    y={VOL_Y - 1}
                    fill="rgba(255,255,255,0.18)"
                    fontSize={6}
                    fontFamily="monospace"
                  >
                    VOL
                  </text>

                  {/* Candlesticks and Volume */}
                  {candles.map((candle, i) => {
                    const cx = i * SLOT_W + SLOT_W / 2;
                    const x = cx - BODY_W / 2;
                    const bull = candle.close >= candle.open;

                    const bodyTop = priceToY(
                      Math.max(candle.open, candle.close),
                    );
                    const bodyBottom = priceToY(
                      Math.min(candle.open, candle.close),
                    );
                    const bodyHeight = Math.max(1, bodyBottom - bodyTop);

                    const wickTop = priceToY(candle.high);
                    const wickBottom = priceToY(candle.low);

                    const volBarH = volToH(candle.volume);

                    return (
                      <g key={i}>
                        {/* Wick line */}
                        <line
                          x1={cx}
                          y1={wickTop}
                          x2={cx}
                          y2={wickBottom}
                          style={{
                            stroke: bull ? 'var(--profit)' : 'var(--loss)',
                          }}
                          strokeWidth={1}
                        />
                        {/* Candle body */}
                        <rect
                          x={x}
                          y={bodyTop}
                          width={BODY_W}
                          height={bodyHeight}
                          style={{
                            fill: bull ? 'var(--profit)' : 'var(--loss)',
                          }}
                          rx={0.8}
                          opacity={0.9}
                        />
                        {/* Volume bar */}
                        <rect
                          x={x}
                          y={VOL_Y + VOL_H - volBarH}
                          width={BODY_W}
                          height={volBarH}
                          style={{
                            fill: bull ? 'var(--profit)' : 'var(--loss)',
                          }}
                          opacity={0.2}
                          rx={0.5}
                        />
                      </g>
                    );
                  })}

                  {/* Current price line */}
                  <line
                    x1={0}
                    y1={priceToY(lastCandle.close)}
                    x2={CHART_W}
                    y2={priceToY(lastCandle.close)}
                    style={{
                      stroke: isUp ? 'var(--profit)' : 'var(--loss)',
                    }}
                    strokeWidth={0.5}
                    strokeDasharray="4,3"
                    opacity={0.6}
                  />
                </svg>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2.5 mt-4">
                <div
                  className="text-center p-2.5 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="text-[10px] uppercase tracking-wider mb-1"
                    style={{ color: 'var(--forex-muted)' }}
                  >
                    High
                  </div>
                  <div
                    className="text-sm font-bold tabular-nums"
                    style={{ color: 'var(--profit)' }}
                  >
                    {formatPrice(high)}
                  </div>
                </div>
                <div
                  className="text-center p-2.5 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="text-[10px] uppercase tracking-wider mb-1"
                    style={{ color: 'var(--forex-muted)' }}
                  >
                    Low
                  </div>
                  <div
                    className="text-sm font-bold tabular-nums"
                    style={{ color: 'var(--loss)' }}
                  >
                    {formatPrice(low)}
                  </div>
                </div>
                <div
                  className="text-center p-2.5 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="text-[10px] uppercase tracking-wider mb-1"
                    style={{ color: 'var(--forex-muted)' }}
                  >
                    Spread
                  </div>
                  <div
                    className="text-sm font-bold tabular-nums"
                    style={{ color: 'var(--gold)' }}
                  >
                    {formatPrice(spread)}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}