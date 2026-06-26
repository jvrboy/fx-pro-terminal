'use client';

import { useState, useMemo, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface MiniCandlestickProps {
  data?: CandleData[];
  width?: number;
  height?: number;
  bullishColor?: string;
  bearishColor?: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Generate realistic random OHLC candles (20-30) */
function generateRandomData(count: number = 25): CandleData[] {
  const candles: CandleData[] = [];
  let price = 1.08 + Math.random() * 0.04; // realistic FX starting price

  for (let i = 0; i < count; i++) {
    const volatility = 0.0003 + Math.random() * 0.0015;
    const direction = Math.random() > 0.48 ? 1 : -1;
    const move = direction * volatility * (0.3 + Math.random() * 0.7);
    const open = price;
    const close = price + move;
    const high = Math.max(open, close) + Math.random() * volatility * 0.8;
    const low = Math.min(open, close) - Math.random() * volatility * 0.8;

    candles.push({ open, high, low, close });
    price = close;
  }

  return candles;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MiniCandlestick({
  data,
  width = 200,
  height = 80,
  bullishColor,
  bearishColor,
  className,
}: MiniCandlestickProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Memoise data so random generation only happens once per mount
  const candles = useMemo<CandleData[]>(() => data ?? generateRandomData(), [data]);

  // Resolve colours – fall back to CSS variables
  const bullColor = bullishColor ?? 'var(--profit)';
  const bearColor = bearishColor ?? 'var(--loss)';

  // Chart geometry constants
  const padX = 4;
  const padTop = 6;
  const padBot = 2;
  const chartW = width - padX * 2;
  const chartH = height - padTop - padBot;

  // Price range
  const allHighs = candles.map((c) => c.high);
  const allLows = candles.map((c) => c.low);
  const minPrice = Math.min(...allLows);
  const maxPrice = Math.max(...allHighs);
  const priceRange = maxPrice - minPrice || 1;

  // Scale helpers
  const xScale = useCallback(
    (i: number) => padX + (i + 0.5) * (chartW / candles.length),
    [chartW, candles.length],
  );
  const yScale = useCallback(
    (p: number) => padTop + (1 - (p - minPrice) / priceRange) * chartH,
    [padTop, chartH, minPrice, priceRange],
  );

  // Candle body dimensions
  const candleSlot = chartW / candles.length;
  const bodyWidth = candleSlot * 0.6;
  const halfBody = bodyWidth / 2;

  // Gradient area path (close-to-close line with subtle fill)
  const trendPoints = candles
    .map((c, i) => `${xScale(i)},${yScale(c.close)}`)
    .join(' ');

  const areaPath = `M${xScale(0)},${yScale(candles[0].close)} L${trendPoints
    .split(' ')
    .map((p) => p.replace(',', ' L'))
    .join(' ')} L${xScale(candles.length - 1)},${yScale(candles[0].close)} Z`;

  // Determine if overall trend is bullish
  const isBullishTrend =
    candles[candles.length - 1].close >= candles[0].open;
  const trendColor = isBullishTrend ? bullColor : bearColor;

  const lastCandle = candles[candles.length - 1];
  const lastIsBull = lastCandle.close >= lastCandle.open;
  const lastColor = lastIsBull ? bullColor : bearColor;

  // Format price for tooltip (compact)
  const fmt = (v: number) => v.toFixed(4);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Area gradient */}
        <linearGradient id={`area-grad-${className ?? 'default'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={trendColor} stopOpacity="0.18" />
          <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
        </linearGradient>

        {/* Glow filter for last candle */}
        <filter id={`glow-${className ?? 'default'}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Pulse animation for latest price dot */}
        <radialGradient id={`pulse-grad-${className ?? 'default'}`}>
          <stop offset="0%" stopColor={lastColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={lastColor} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Subtle area fill under close-to-close trend line */}
      <path d={areaPath} fill={`url(#area-grad-${className ?? 'default'})`} />

      {/* Candles */}
      {candles.map((c, i) => {
        const x = xScale(i);
        const isBull = c.close >= c.open;
        const color = isBull ? bullColor : bearColor;
        const yOpen = yScale(c.open);
        const yClose = yScale(c.close);
        const yHigh = yScale(c.high);
        const yLow = yScale(c.low);
        const bodyTop = Math.min(yOpen, yClose);
        const bodyH = Math.max(Math.abs(yClose - yOpen), 1); // min 1px body
        const isLast = i === candles.length - 1;
        const isHovered = hoveredIndex === i;

        return (
          <g
            key={i}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* Hover background highlight */}
            {isHovered && (
              <rect
                x={x - halfBody - 1}
                y={padTop}
                width={bodyWidth + 2}
                height={chartH}
                rx={2}
                fill="white"
                opacity={0.06}
              />
            )}

            {/* Wick (high-low line) */}
            <line
              x1={x}
              y1={yHigh}
              x2={x}
              y2={yLow}
              stroke={color}
              strokeWidth={1}
              opacity={isLast ? 1 : 0.85}
              filter={isLast ? `url(#glow-${className ?? 'default'})` : undefined}
            />

            {/* Body */}
            <rect
              x={x - halfBody}
              y={bodyTop}
              width={bodyWidth}
              height={bodyH}
              rx={0.5}
              fill={isBull ? color : color}
              opacity={isHovered ? 1 : isLast ? 1 : 0.85}
              filter={isLast ? `url(#glow-${className ?? 'default'})` : undefined}
            />
          </g>
        );
      })}

      {/* Pulse dot on latest price */}
      {(() => {
        const x = xScale(candles.length - 1);
        const y = yScale(lastCandle.close);
        return (
          <g>
            <circle cx={x} cy={y} r={6} fill={`url(#pulse-grad-${className ?? 'default'})`}>
              <animate
                attributeName="r"
                values="3;7;3"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;0;0.6"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={x} cy={y} r={2} fill={lastColor}>
              <animate
                attributeName="opacity"
                values="1;0.6;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        );
      })()}

      {/* Hover tooltip */}
      {hoveredIndex !== null && (() => {
        const c = candles[hoveredIndex];
        const cx = xScale(hoveredIndex);
        const cy = yScale(c.close);
        // Keep tooltip within viewBox
        const tipX = cx + 8 > width - 60 ? cx - 68 : cx + 8;
        const tipY = cy - 24 < 4 ? cy + 6 : cy - 24;
        return (
          <g>
            <rect
              x={tipX}
              y={tipY}
              width={62}
              height={22}
              rx={4}
              fill="rgba(15,15,20,0.92)"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={0.5}
            />
            <text
              x={tipX + 5}
              y={tipY + 9}
              fill="rgba(255,255,255,0.5)"
              fontSize={6}
              fontFamily="monospace"
            >
              O {fmt(c.open)} H {fmt(c.high)}
            </text>
            <text
              x={tipX + 5}
              y={tipY + 17}
              fill="rgba(255,255,255,0.5)"
              fontSize={6}
              fontFamily="monospace"
            >
              L {fmt(c.low)} C {fmt(c.close)}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}