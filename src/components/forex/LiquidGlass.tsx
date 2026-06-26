'use client';

import { useCallback, useRef, type ReactNode, type MouseEvent } from 'react';

interface LiquidGlassProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function LiquidGlass({ children, className = '', onClick }: LiquidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 1.5;

    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.marginLeft = `${-size / 2}px`;
    ripple.style.marginTop = `${-size / 2}px`;

    container.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
    onClick?.();
  }, [onClick]);

  return (
    <div
      ref={containerRef}
      className={`liquid-glass ${className}`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}
