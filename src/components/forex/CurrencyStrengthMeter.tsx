'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface CurrencyStrengthMeterProps {
  data?: Record<string, number>; // currency -> strength (0-100)
  size?: number; // default 200
  className?: string;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'NZD', 'CHF'] as const;
const NUM_AXES = CURRENCIES.length;
const ANGLE_STEP = (2 * Math.PI) / NUM_AXES;
const PADDING = 32;

function generateInitialStrengths(): Record<string, number> {
  // Realistic starting strengths with some variation
  const base: Record<string, number> = {
    USD: 62, EUR: 71, GBP: 58, JPY: 38, AUD: 45, CAD: 53, NZD: 41, CHF: 49,
  };
  const result: Record<string, number> = {};
  for (const c of CURRENCIES) {
    const jitter = (Math.random() - 0.5) * 8;
    result[c] = Math.min(100, Math.max(0, Math.round((base[c] ?? 50) + jitter)));
  }
  return result;
}

function driftStrengths(prev: Record<string, number>): Record<string, number> {
  const next: Record<string, number> = {};
  for (const c of CURRENCIES) {
    const delta = (Math.random() - 0.5) * 4; // ±2
    next[c] = Math.min(100, Math.max(0, Math.round((prev[c] ?? 50) + delta)));
  }
  return next;
}

export default function CurrencyStrengthMeter({
  data,
  size = 200,
  className = '',
}: CurrencyStrengthMeterProps) {
  const [strengths, setStrengths] = useState<Record<string, number>>(() =>
    data ? { ...data } : generateInitialStrengths()
  );
  const [pulsePhase, setPulsePhase] = useState(0);
  const animRef = useRef<number>(0);

  // Update strengths every 5 seconds
  useEffect(() => {
    if (data) return; // controlled mode — no auto-update
    const id = setInterval(() => {
      setStrengths((prev) => driftStrengths(prev));
    }, 5000);
    return () => clearInterval(id);
  }, [data]);

  // Subtle pulse animation
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      setPulsePhase((p) => (p + 0.015) % (2 * Math.PI));
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Sync with external data
  const currentStrengths = data ?? strengths;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - PADDING;

  // Compute axis endpoint for a given index and radius ratio (0-1)
  const axisPoint = useCallback(
    (index: number, ratio: number) => {
      const angle = index * ANGLE_STEP - Math.PI / 2;
      return {
        x: cx + Math.cos(angle) * maxR * ratio,
        y: cy + Math.sin(angle) * maxR * ratio,
      };
    },
    [cx, cy, maxR]
  );

  // Polygon points for the data shape
  const dataPoints = CURRENCIES.map((c, i) => {
    const ratio = (currentStrengths[c] ?? 0) / 100;
    const p = axisPoint(i, ratio);
    return `${p.x},${p.y}`;
  });

  // Guide circle radii
  const guideRatios = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Pulse opacity for polygon fill
  const pulseOpacity = 0.15 + Math.sin(pulsePhase) * 0.05; // 0.10 – 0.20

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label="Currency strength radar chart"
    >
      <defs>
        {/* Gradient from accent (strong) fading to transparent */}
        <radialGradient id="csm-fill-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--forex-accent)" stopOpacity={pulseOpacity + 0.15} />
          <stop offset="100%" stopColor="var(--forex-accent)" stopOpacity={pulseOpacity * 0.3} />
        </radialGradient>
        {/* Glow filter */}
        <filter id="csm-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Guide circles */}
      {guideRatios.map((r) => {
        const rPx = maxR * r;
        return (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={rPx}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={0.6}
          />
        );
      })}

      {/* Axis lines */}
      {CURRENCIES.map((_, i) => {
        const end = axisPoint(i, 1);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={end.x}
            y2={end.y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={0.6}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPoints.join(' ')}
        fill="url(#csm-fill-grad)"
        stroke="var(--forex-accent)"
        strokeWidth={1.2}
        strokeOpacity={0.6}
        filter="url(#csm-glow)"
      />

      {/* Data points (dots on vertices) */}
      {CURRENCIES.map((c, i) => {
        const ratio = (currentStrengths[c] ?? 0) / 100;
        const p = axisPoint(i, ratio);
        const strength = currentStrengths[c] ?? 0;
        // Color based on strength: green for strong, red for weak, gold for mid
        let dotColor = 'var(--gold)';
        if (strength >= 65) dotColor = 'var(--profit)';
        else if (strength <= 40) dotColor = 'var(--loss)';
        return (
          <g key={c}>
            <circle cx={p.x} cy={p.y} r={2.5} fill={dotColor} />
            {/* Strength value */}
            <text
              x={p.x}
              y={p.y - 5}
              textAnchor="middle"
              dominantBaseline="auto"
              fill={dotColor}
              fontSize={8}
              fontWeight={700}
              className="font-mono"
              style={{ fontFamily: 'ui-monospace, monospace' }}
            >
              {strength}
            </text>
          </g>
        );
      })}

      {/* Currency labels at axis tips */}
      {CURRENCIES.map((c, i) => {
        const end = axisPoint(i, 1.18); // push labels beyond the circle
        return (
          <text
            key={c}
            x={end.x}
            y={end.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--forex-text)"
            fontSize={9}
            style={{ fontFamily: 'ui-monospace, monospace' }}
          >
            {c}
          </text>
        );
      })}
    </svg>
  );
}