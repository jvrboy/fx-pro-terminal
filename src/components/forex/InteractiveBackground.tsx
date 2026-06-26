'use client';

import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion';

interface InteractiveBackgroundProps {
  children: React.ReactNode;
}

// Pre-compute deterministic particle positions to avoid hydration mismatch
function generateParticles(count: number) {
  const particles: { left: number; dur: number; delay: number; w: number; h: number; opacity: number }[] = [];
  for (let i = 0; i < count; i++) {
    // Use a simple seeded-like approach based on index
    const seed = (i * 2654435761) >>> 0;
    const seed2 = ((i + 7) * 1597334677) >>> 0;
    const seed3 = ((i + 13) * 2246822519) >>> 0;
    const seed4 = ((i + 19) * 3266489917) >>> 0;
    const seed5 = ((i + 23) * 982451653) >>> 0;

    particles.push({
      left: (seed % 10000) / 100,
      dur: 8 + (seed2 % 12000) / 1000,
      delay: (seed3 % 10000) / 1000,
      w: 1 + (seed4 % 200) / 100,
      h: 1 + (seed5 % 200) / 100,
      opacity: 0.2 + ((seed + seed2) % 400) / 1000,
    });
  }
  return particles;
}

export default function InteractiveBackground({ children }: InteractiveBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 40, damping: 28 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 28 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Transform spring values for orb movement
  const orb1X = useTransform(springX, [-1, 1], [-20, 20]);
  const orb1Y = useTransform(springY, [-1, 1], [-20, 20]);
  const orb2X = useTransform(springX, [-1, 1], [15, -15]);
  const orb2Y = useTransform(springY, [-1, 1], [15, -15]);
  const orb3X = useTransform(springX, [-1, 1], [-10, 10]);
  const orb3Y = useTransform(springY, [-1, 1], [-10, 10]);

  // Mouse glow position
  const glowX = useTransform(springX, [-1, 1], [35, 65]);
  const glowY = useTransform(springY, [-1, 1], [35, 65]);

  const particles = useMemo(() => generateParticles(25), []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden"
      style={{ perspective: '1200px' }}
    >
      {/* Moving grid background */}
      <div className="absolute inset-0 bg-3d-grid" />

      {/* Floating orbs - now actually follow mouse */}
      <motion.div
        className="orb orb-1"
        style={{ x: orb1X, y: orb1Y }}
      />
      <motion.div
        className="orb orb-2"
        style={{ x: orb2X, y: orb2Y }}
      />
      <motion.div
        className="orb orb-3"
        style={{ x: orb3X, y: orb3Y }}
      />

      {/* Particle field - deterministic positions */}
      <div className="particle-field">
        {particles.map((p, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${p.left}%`,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
              width: `${p.w}px`,
              height: `${p.h}px`,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>

      {/* Background vignette for depth */}
      <div className="bg-vignette" />

      {/* Scan line for sci-fi terminal feel */}
      <div className="scan-line" />

      {/* Mouse-following glow - now actually follows mouse */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(600px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(114, 198, 157, 0.04), transparent 60%)',
          '--glow-x': useTransform(glowX, (v) => `${v}%`),
          '--glow-y': useTransform(glowY, (v) => `${v}%`),
        } as React.CSSProperties}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
