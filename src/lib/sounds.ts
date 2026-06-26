'use client';

import { useCallback, useRef } from 'react';

type SoundType = 'tick' | 'signal' | 'message' | 'trade' | 'click';

// Web Audio API sound system
class SoundEngine {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  private playTone(frequency: number, duration: number, volume: number = 0.15, type: OscillatorType = 'sine') {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio not supported or blocked
    }
  }

  tick() {
    this.playTone(800, 0.05, 0.05, 'sine');
  }

  signal() {
    this.playTone(880, 0.15, 0.2, 'sine');
    setTimeout(() => this.playTone(1100, 0.15, 0.15, 'sine'), 100);
    setTimeout(() => this.playTone(1320, 0.2, 0.12, 'sine'), 200);
  }

  message() {
    this.playTone(600, 0.08, 0.12, 'sine');
    setTimeout(() => this.playTone(800, 0.08, 0.08, 'sine'), 60);
  }

  trade() {
    if (Math.random() > 0.5) {
      // Win sound
      this.playTone(523, 0.12, 0.15, 'sine');
      setTimeout(() => this.playTone(659, 0.12, 0.15, 'sine'), 100);
      setTimeout(() => this.playTone(784, 0.15, 0.12, 'sine'), 200);
    } else {
      // Loss sound
      this.playTone(400, 0.15, 0.15, 'sine');
      setTimeout(() => this.playTone(350, 0.2, 0.1, 'sine'), 120);
    }
  }

  click() {
    this.playTone(1200, 0.03, 0.06, 'sine');
  }
}

// Singleton
let soundEngine: SoundEngine | null = null;

export function getSoundEngine(): SoundEngine {
  if (!soundEngine) {
    soundEngine = new SoundEngine();
  }
  return soundEngine;
}

export function useSound() {
  const enabledRef = useRef(true);

  const play = useCallback((type: SoundType) => {
    if (!enabledRef.current) return;
    const engine = getSoundEngine();
    engine[type]();
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  return { play, setEnabled };
}
