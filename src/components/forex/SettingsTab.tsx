'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, Flame, Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Bell,
  Volume2,
  Moon,
  Sun,
  Minimize2,
  Maximize2,
  AlertTriangle,
  Globe,
  Clock,
  Shield,
  ChevronRight,
  User,
  Palette,
  Sliders,
  Keyboard,
  LogOut,
  Info,
  Link,
  HardDrive,
  Download,
  Trash2,
  FileText,
  Brain,
  Database,
  Cpu,
  RefreshCw,
  Zap,
  Eye,
  Infinity,
  Wallet,
  Target,
  BarChart3,
  Plus,
  Minus,
  Crown,
} from 'lucide-react';
import { useForexStore } from '@/lib/store';
import LiquidGlass from './LiquidGlass';

interface ToggleSettingProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  active: boolean;
  onToggle: () => void;
}

function ToggleSetting({ icon, label, description, active, onToggle }: ToggleSettingProps) {
  return (
    <div className="settings-item">
      <div className="flex items-center justify-between py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-[var(--forex-muted)]">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium leading-tight">{label}</div>
            <div className="text-[9px] text-[var(--forex-muted)] leading-tight">{description}</div>
          </div>
        </div>
        <LiquidGlass>
          <button
            onClick={onToggle}
            className={`toggle-3d flex-shrink-0 ${active ? 'active' : ''}`}
          >
            <div className="toggle-knob" />
          </button>
        </LiquidGlass>
      </div>
    </div>
  );
}

interface SliderSettingProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  displayOverride?: string;
}

function SliderSetting({ icon, label, value, unit, min, max, step, onChange, disabled, displayOverride }: SliderSettingProps) {
  return (
    <div className="settings-item py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-[var(--forex-muted)]">
            {icon}
          </div>
          <span className="text-[13px] font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          {displayOverride ? (
            <span className="text-[13px] font-bold text-[var(--forex-accent)]">{displayOverride}</span>
          ) : (
            <span className="text-[13px] font-bold text-[var(--forex-accent)]">{value}</span>
          )}
          {!displayOverride && <span className="text-[9px] text-[var(--forex-muted)]">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: `linear-gradient(to right, var(--forex-accent) 0%, var(--forex-accent) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.06) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.06) 100%)`,
        }}
      />
    </div>
  );
}

function MiniEquityCurve() {
  // Generate realistic 30-day equity data: start ~$23,500, end ~$24,831
  const points = (() => {
    const data: number[] = [23500];
    const seed = [42, 87, 13, 64, 29, 95, 51, 38, 76, 4, 83, 19, 67, 33, 91, 58, 12, 74, 46, 8, 89, 25, 71, 53, 16, 98, 41, 69, 34, 82];
    for (let i = 1; i < 30; i++) {
      const rand = (seed[i] - 50) / 500;
      const trend = (24831 - 23500) / 30 / 23500;
      const change = trend + rand * 0.008;
      const prev = data[i - 1];
      let next = prev * (1 + change);
      // Add some pullback dips for realism
      if (i === 7 || i === 14 || i === 22) next = prev * (1 - 0.003 + rand * 0.002);
      data.push(next);
    }
    // Ensure final point is close to target
    data[29] = 24831;
    return data;
  })();

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 150;
  const h = 50;
  const pad = 2;

  const coords = points.map((v, i) => ({
    x: pad + (i / (points.length - 1)) * (w - 2 * pad),
    y: pad + (1 - (v - min) / range) * (h - 2 * pad),
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${h} L${coords[0].x.toFixed(1)},${h} Z`;

  return (
    <motion.svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full max-w-[150px] h-[50px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      <defs>
        <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--profit)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--profit)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill="url(#equityGrad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="var(--profit)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
      />
      {/* End dot */}
      <motion.circle
        cx={coords[coords.length - 1].x}
        cy={coords[coords.length - 1].y}
        r="2"
        fill="var(--profit)"
        initial={{ opacity: 0, r: 0 }}
        animate={{ opacity: 1, r: 2 }}
        transition={{ duration: 0.3, delay: 1.2 }}
      />
    </motion.svg>
  );
}

export default function SettingsTab() {
  const { currentUser, agentStatus } = useForexStore();

  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    soundEnabled: true,
    darkMode: true,
    compactView: false,
    signalAlerts: true,
    priceAlerts: false,
    autoScroll: true,
    showAvatars: true,
    language: 'English',
    timezone: 'UTC',
    riskPerTrade: 2,
    maxDailyTrades: 5,
    maxDailyTradesUnlimited: false,
    agentAutoLearn: true,
    agentMemoryLimit: 500,
    signalMonitorEnabled: true,
  });

  const updateSetting = useCallback((key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  }, []);

  const updateSlider = useCallback((key: string, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const agentRunning = agentStatus?.signalMonitor?.running;
  const signalProcessed = agentStatus?.signalMonitor?.signalsProcessed || 0;
  const agentAccuracy = agentStatus?.signalMonitor?.accuracy || 0;
  const memoryCount = agentStatus?.memoryEngine?.memoriesCount || 0;
  const pipelines = agentStatus?.pipelineEngine?.pipelinesActive || 0;
  const trainingIter = agentStatus?.selfTrainer?.trainingIterations || 0;
  const modelVersion = agentStatus?.selfTrainer?.modelVersion || 'v3.0';

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto forex-scrollbar pb-20">
        {/* Account Dashboard */}
        <motion.div
          className="px-3 py-3 md:px-4 border-b border-white/[0.06]"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div className="glass rounded-xl p-4 border-accent-top">
            {/* Profile Card */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--gold)] via-[var(--forex-accent)] to-[var(--gold)] p-[1.5px]">
                  <div className="w-full h-full rounded-full bg-[var(--forex-bg)] flex items-center justify-center">
                    <span className="text-[13px] font-bold text-[var(--forex-text)]">T</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-[var(--forex-text)] truncate">TraderPro</span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded-full bg-[var(--gold)]/10 text-[var(--gold)] text-[9px] font-semibold tracking-wide">
                    <Crown className="w-2.5 h-2.5" />
                    PRO
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-[var(--forex-muted)]">Senior Trader</span>
                  <span className="text-[10px] text-[var(--forex-muted)]">·</span>
                  <span className="text-[10px] text-[var(--forex-muted)]">Since Jan 2024</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              <div className="glass-subtle rounded-lg p-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Wallet className="w-3 h-3 text-[var(--forex-muted)]" />
                  <span className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider">Balance</span>
                </div>
                <div className="text-[13px] font-bold text-[var(--forex-text)]">$24,831.50</div>
                <div className="text-[9px] text-[var(--profit)] mt-0.5">+2.4%</div>
              </div>
              <div className="glass-subtle rounded-lg p-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3 h-3 text-[var(--forex-muted)]" />
                  <span className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider">Today P/L</span>
                </div>
                <div className="text-[13px] font-bold text-[var(--profit)]">+$387.20</div>
                <div className="text-[9px] text-[var(--profit)] mt-0.5">+1.58%</div>
              </div>
              <div className="glass-subtle rounded-lg p-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="w-3 h-3 text-[var(--forex-muted)]" />
                  <span className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider">Win Rate</span>
                </div>
                <div className="text-[13px] font-bold text-[var(--forex-text)]">68.5%</div>
                <div className="text-[9px] text-[var(--profit)] mt-0.5">+2.1%</div>
              </div>
              <div className="glass-subtle rounded-lg p-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <BarChart3 className="w-3 h-3 text-[var(--forex-muted)]" />
                  <span className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider">Total Trades</span>
                </div>
                <div className="text-[13px] font-bold text-[var(--forex-text)]">142</div>
                <div className="text-[9px] text-[var(--forex-muted)] mt-0.5">--</div>
              </div>
            </div>

            {/* Mini Equity Curve + Quick Actions */}
            <div className="flex items-end justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider mb-1">Equity (30d)</div>
                <MiniEquityCurve />
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button className="glass-subtle micro-glass rounded-full px-2.5 py-1 flex items-center gap-1 text-[10px] text-[var(--forex-text)] hover:text-[var(--profit)] transition-colors">
                  <Plus className="w-2.5 h-2.5" />
                  <span>Deposit</span>
                </button>
                <button className="glass-subtle micro-glass rounded-full px-2.5 py-1 flex items-center gap-1 text-[10px] text-[var(--forex-text)] hover:text-[var(--loss)] transition-colors">
                  <Minus className="w-2.5 h-2.5" />
                  <span>Withdraw</span>
                </button>
                <button className="glass-subtle micro-glass rounded-full px-2.5 py-1 flex items-center gap-1 text-[10px] text-[var(--forex-text)] hover:text-[var(--forex-accent)] transition-colors">
                  <Download className="w-2.5 h-2.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Section */}
        <div className="px-3 py-3 md:px-4 border-b border-white/[0.06]">
          <div className="glass rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[var(--forex-accent)]/20 to-[var(--gold)]/20 flex items-center justify-center text-base md:text-lg font-bold text-[var(--forex-accent)]">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm md:text-base font-bold truncate">{currentUser.username}</div>
                <div className="text-[10px] md:text-xs text-[var(--forex-muted)]">
                  {currentUser.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              </div>
              <LiquidGlass>
                <button className="btn-3d p-2 rounded-lg glass">
                  <ChevronRight className="w-4 h-4 text-[var(--forex-muted)]" />
                </button>
              </LiquidGlass>
            </div>

            <div className="grid grid-cols-3 gap-1.5 md:gap-2 mt-3">
              <div className="glass-subtle rounded-lg p-1.5 md:p-2 text-center">
                <div className="text-[8px] md:text-[9px] text-[var(--forex-muted)] uppercase tracking-wider">Session</div>
                <div className="text-[9px] md:text-[10px] font-semibold mt-0.5">London</div>
              </div>
              <div className="glass-subtle rounded-lg p-1.5 md:p-2 text-center">
                <div className="text-[8px] md:text-[9px] text-[var(--forex-muted)] uppercase tracking-wider">Account</div>
                <div className="text-[9px] md:text-[10px] font-semibold mt-0.5">Standard</div>
              </div>
              <div className="glass-subtle rounded-lg p-1.5 md:p-2 text-center">
                <div className="text-[8px] md:text-[9px] text-[var(--forex-muted)] uppercase tracking-wider">Status</div>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--profit)] pulse-dot" />
                  <span className="text-[9px] md:text-[10px] font-semibold text-[var(--profit)]">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Agents Section */}
        <div className="settings-section px-3 md:px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-3.5 h-3.5 text-[var(--gold)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--gold)]">AI Agents</span>
            {agentRunning && (
              <span className="text-[8px] font-bold text-[var(--profit)] uppercase px-1.5 py-0.5 rounded bg-[var(--profit)]/10">Running</span>
            )}
          </div>

          {/* Agent Status Cards */}
          <div className="glass rounded-xl p-2.5 mb-2 card-depth-1">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="glass-subtle rounded-lg p-2 text-center">
                <div className="text-[8px] text-[var(--forex-muted)] uppercase tracking-wider">Signals Analyzed</div>
                <div className="text-sm font-bold font-mono text-[var(--forex-accent)] mt-0.5">{signalProcessed}</div>
              </div>
              <div className="glass-subtle rounded-lg p-2 text-center">
                <div className="text-[8px] text-[var(--forex-muted)] uppercase tracking-wider">Accuracy</div>
                <div className="text-sm font-bold font-mono text-[var(--profit)] mt-0.5">{agentAccuracy}%</div>
              </div>
              <div className="glass-subtle rounded-lg p-2 text-center">
                <div className="text-[8px] text-[var(--forex-muted)] uppercase tracking-wider">Memories</div>
                <div className="text-sm font-bold font-mono text-[var(--gold)] mt-0.5">{memoryCount}</div>
              </div>
              <div className="glass-subtle rounded-lg p-2 text-center">
                <div className="text-[8px] text-[var(--forex-muted)] uppercase tracking-wider">Pipelines</div>
                <div className="text-sm font-bold font-mono text-[var(--forex-text)] mt-0.5">{pipelines}</div>
              </div>
            </div>
          </div>

          <ToggleSetting
            icon={<Brain className="w-4 h-4" />}
            label="Signal Monitor"
            description="Analyzes signals and self-improves accuracy"
            active={settings.signalMonitorEnabled}
            onToggle={() => updateSetting('signalMonitorEnabled')}
          />
          <ToggleSetting
            icon={<Database className="w-4 h-4" />}
            label="Auto-Learn & Memory"
            description="AI learns from every signal and trade outcome"
            active={settings.agentAutoLearn}
            onToggle={() => updateSetting('agentAutoLearn')}
          />
          <SliderSetting
            icon={<Cpu className="w-4 h-4" />}
            label="Memory Limit"
            value={settings.agentMemoryLimit}
            unit="entries"
            min={100}
            max={1000}
            step={50}
            onChange={(v) => updateSlider('agentMemoryLimit', v)}
          />

          {/* Training info */}
          <div className="glass-subtle rounded-lg p-2.5 mt-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-[var(--gold)]" />
                <div>
                  <div className="text-[10px] font-semibold">Self-Training Engine</div>
                  <div className="text-[8px] text-[var(--forex-muted)]">Model {modelVersion} | {trainingIter} iterations</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--profit)] pulse-dot" />
                <span className="text-[8px] text-[var(--profit)] font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glow-divider" />

        {/* Notifications */}
        <div className="settings-section px-3 md:px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-3.5 h-3.5 text-[var(--forex-accent)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--forex-muted)]">Notifications</span>
          </div>
          <ToggleSetting
            icon={<Bell className="w-4 h-4" />}
            label="Push Notifications"
            description="Receive signal and trade alerts"
            active={settings.notificationsEnabled}
            onToggle={() => updateSetting('notificationsEnabled')}
          />
          <ToggleSetting
            icon={<Volume2 className="w-4 h-4" />}
            label="Sound Effects"
            description="Audible alerts for price movements"
            active={settings.soundEnabled}
            onToggle={() => updateSetting('soundEnabled')}
          />
          <ToggleSetting
            icon={<TrendingUp className="w-4 h-4" />}
            label="Signal Alerts"
            description="New trading signal notifications"
            active={settings.signalAlerts}
            onToggle={() => updateSetting('signalAlerts')}
          />
          <ToggleSetting
            icon={<AlertTriangle className="w-4 h-4" />}
            label="Price Alerts"
            description="Custom price level alerts"
            active={settings.priceAlerts}
            onToggle={() => updateSetting('priceAlerts')}
          />
        </div>

        <div className="glow-divider" />

        {/* Connected Accounts */}
        <div className="settings-section px-3 md:px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <Link className="w-3.5 h-3.5 text-[var(--forex-accent)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--forex-muted)]">Connected</span>
          </div>
          <div className="space-y-1">
            <LiquidGlass>
              <div className="settings-item flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center">
                    <span className="text-[9px] font-bold text-[var(--forex-text)]">OA</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-medium">OANDA</div>
                    <div className="text-[9px] text-[var(--forex-muted)]">Broker</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="status-pill status-pill-active">
                    <span className="w-1 h-1 rounded-full bg-[var(--profit)]" />
                    Connected
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--forex-muted)]" />
                </div>
              </div>
            </LiquidGlass>
            <LiquidGlass>
              <div className="settings-item flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center">
                    <span className="text-[9px] font-bold text-[var(--forex-text)]">BB</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-medium">Bloomberg</div>
                    <div className="text-[9px] text-[var(--forex-muted)]">Data Feed</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="status-pill status-pill-active">
                    <span className="w-1 h-1 rounded-full bg-[var(--profit)]" />
                    Connected
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--forex-muted)]" />
                </div>
              </div>
            </LiquidGlass>
          </div>
        </div>

        <div className="glow-divider" />

        {/* Appearance */}
        <div className="settings-section px-3 md:px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-3.5 h-3.5 text-[var(--forex-accent)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--forex-muted)]">Appearance</span>
          </div>
          <ToggleSetting
            icon={settings.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            label="Dark Mode"
            description="Use dark color scheme"
            active={settings.darkMode}
            onToggle={() => updateSetting('darkMode')}
          />
          <ToggleSetting
            icon={settings.compactView ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            label="Compact View"
            description="Reduce spacing between elements"
            active={settings.compactView}
            onToggle={() => updateSetting('compactView')}
          />
          <ToggleSetting
            icon={<Eye className="w-4 h-4" />}
            label="Show Avatars"
            description="Display user avatars in chat"
            active={settings.showAvatars}
            onToggle={() => updateSetting('showAvatars')}
          />
        </div>

        <div className="glow-divider" />

        {/* Trading Preferences */}
        <div className="settings-section px-3 md:px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-3.5 h-3.5 text-[var(--forex-accent)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--forex-muted)]">Trading</span>
          </div>
          <SliderSetting
            icon={<Shield className="w-4 h-4" />}
            label="Risk Per Trade"
            value={settings.riskPerTrade}
            unit="%"
            min={0.5}
            max={10}
            step={0.5}
            onChange={(v) => updateSlider('riskPerTrade', v)}
          />

          {/* Max Daily Trades with Unlimited option */}
          <div className="settings-item py-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-[var(--forex-muted)]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-[13px] font-medium">Max Daily Trades</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold text-[var(--forex-accent)]">
                  {settings.maxDailyTradesUnlimited ? 'Unlimited' : settings.maxDailyTrades}
                </span>
                {!settings.maxDailyTradesUnlimited && (
                  <span className="text-[9px] text-[var(--forex-muted)]">trades</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={settings.maxDailyTradesUnlimited ? 100 : settings.maxDailyTrades}
                disabled={settings.maxDailyTradesUnlimited}
                onChange={(e) => updateSlider('maxDailyTrades', Number(e.target.value))}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(to right, var(--forex-accent) 0%, var(--forex-accent) ${settings.maxDailyTradesUnlimited ? 100 : settings.maxDailyTrades}%, rgba(255,255,255,0.06) ${settings.maxDailyTradesUnlimited ? 100 : settings.maxDailyTrades}%, rgba(255,255,255,0.06) 100%)`,
                }}
              />
              <LiquidGlass>
                <button
                  onClick={() => updateSetting('maxDailyTradesUnlimited')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                    settings.maxDailyTradesUnlimited
                      ? 'bg-[var(--forex-accent)]/15 text-[var(--forex-accent)] border border-[var(--forex-accent)]/30'
                      : 'glass-subtle text-[var(--forex-muted)] hover:text-[var(--forex-text)]'
                  }`}
                >
                  <Infinity className="w-3 h-3" />
                  <span>Unlimited</span>
                </button>
              </LiquidGlass>
            </div>
          </div>
        </div>

        <div className="glow-divider" />

        {/* Risk Management Summary */}
        <div className="settings-section px-3 md:px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-3.5 h-3.5 text-[var(--forex-accent)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--forex-muted)]">Risk Management</span>
          </div>
          <div className="glass rounded-xl p-2.5 card-depth-1">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <div className="mini-stat">
                <span className="mini-stat-label">Risk Level</span>
                <span className="mini-stat-value" style={{ color: 'var(--gold)' }}>Moderate</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-label">Monthly DD</span>
                <span className="mini-stat-value" style={{ color: 'var(--loss)' }}>-2.4%</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-label">Max DD</span>
                <span className="mini-stat-value text-[var(--forex-muted)]">10%</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-label">Risk Score</span>
                <span className="mini-stat-value text-[var(--forex-accent)]">72/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Dashboard */}
        <div className="settings-section px-3 md:px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-3.5 h-3.5 text-[var(--gold)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--gold)]">Risk Dashboard</span>
          </div>

          <div className="space-y-2">
            {/* Risk Exposure Bar */}
            <div className="glass rounded-xl p-3 card-depth-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-[var(--forex-muted)] uppercase tracking-wider">Risk Exposure</span>
                <span className="text-[11px] font-mono font-bold text-[var(--gold)]">2.3%</span>
              </div>
              <div className={`w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden ${2.3 / 3 > 0.75 ? 'breathe-glow' : ''}`}>
                <motion.div
                  className="progress-fill h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, var(--gold), var(--forex-accent))' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((2.3 / 3) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[8px] text-[var(--forex-muted)]">0%</span>
                <span className="text-[8px] text-[var(--loss)]">Max: 3%</span>
              </div>
            </div>

            {/* Daily P&L Tracker */}
            <div className="glass rounded-xl p-3 card-depth-1">
              <div className="flex items-center gap-1.5 mb-2.5">
                <TrendingUp className="w-3 h-3 text-[var(--forex-accent)]" />
                <span className="text-[10px] font-semibold text-[var(--forex-muted)] uppercase tracking-wider">P&L Tracker</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="glass-deep rounded-lg p-2 text-center">
                  <div className="text-[8px] text-[var(--forex-muted)] uppercase tracking-wider">Today</div>
                  <div className="text-[13px] font-mono font-bold text-[var(--profit)] mt-0.5">+$342.50</div>
                </div>
                <div className="glass-deep rounded-lg p-2 text-center">
                  <div className="text-[8px] text-[var(--forex-muted)] uppercase tracking-wider">Weekly</div>
                  <div className="text-[13px] font-mono font-bold text-[var(--profit)] mt-0.5">+$1,205</div>
                </div>
                <div className="glass-deep rounded-lg p-2 text-center">
                  <div className="text-[8px] text-[var(--forex-muted)] uppercase tracking-wider">Monthly</div>
                  <div className="text-[13px] font-mono font-bold text-[var(--profit)] mt-0.5">+$3,847</div>
                </div>
              </div>
            </div>

            {/* Risk Limits */}
            <div className="glass rounded-xl p-3 card-depth-1">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Flame className="w-3 h-3 text-[var(--loss)]" />
                <span className="text-[10px] font-semibold text-[var(--forex-muted)] uppercase tracking-wider">Risk Limits</span>
              </div>
              <div className="space-y-2.5">
                {/* Max Daily Risk */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[var(--forex-text)]">Max Daily Risk</span>
                    <span className="text-[10px] font-mono font-bold">2.3% <span className="text-[var(--forex-muted)]">/ 3%</span></span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="progress-fill h-full rounded-full"
                      style={{ background: 'var(--gold)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(2.3 / 3) * 100}%` }}
                      transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                {/* Max Drawdown */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[var(--forex-text)]">Max Drawdown</span>
                    <span className="text-[10px] font-mono font-bold">10%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'var(--loss)', width: '100%', opacity: 0.3 }}
                    />
                  </div>
                </div>
                {/* Current Drawdown */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[var(--forex-text)]">Current Drawdown</span>
                    <span className="text-[10px] font-mono font-bold text-[var(--gold)]">2.1% <span className="text-[var(--forex-muted)]">/ 10%</span></span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="progress-fill h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, var(--profit), var(--gold))' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(2.1 / 10) * 100}%` }}
                      transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Win/Loss Streak */}
            <div className="glass rounded-xl p-3 card-depth-1">
              <div className="flex items-center gap-1.5 mb-2">
                <Trophy className="w-3 h-3 text-[var(--gold)]" />
                <span className="text-[10px] font-semibold text-[var(--forex-muted)] uppercase tracking-wider">Streak</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-[var(--profit)]/15 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-[var(--profit)]" />
                  </div>
                  <div>
                    <div className="text-[16px] font-mono font-bold text-[var(--profit)]">3</div>
                    <div className="text-[8px] text-[var(--forex-muted)] uppercase tracking-wider">Wins</div>
                  </div>
                </div>
                <div className="text-[var(--forex-muted)] text-lg font-light">/</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-[var(--loss)]/15 flex items-center justify-center">
                    <TrendingDown className="w-3.5 h-3.5 text-[var(--loss)]" />
                  </div>
                  <div>
                    <div className="text-[16px] font-mono font-bold text-[var(--loss)]">1</div>
                    <div className="text-[8px] text-[var(--forex-muted)] uppercase tracking-wider">Loss</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glow-divider" />

        {/* General */}
        <div className="settings-section px-3 md:px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <Keyboard className="w-3.5 h-3.5 text-[var(--forex-accent)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--forex-muted)]">General</span>
          </div>

          <div className="space-y-1">
            <LiquidGlass>
              <div className="settings-item flex items-center justify-between cursor-pointer hover:bg-white/[0.02] rounded-lg transition-colors py-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-[var(--forex-muted)]">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium">Language</div>
                    <div className="text-[9px] text-[var(--forex-muted)]">{settings.language}</div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--forex-muted)]" />
              </div>
            </LiquidGlass>

            <LiquidGlass>
              <div className="settings-item flex items-center justify-between cursor-pointer hover:bg-white/[0.02] rounded-lg transition-colors py-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-[var(--forex-muted)]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium">Timezone</div>
                    <div className="text-[9px] text-[var(--forex-muted)]">{settings.timezone}</div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--forex-muted)]" />
              </div>
            </LiquidGlass>

            <LiquidGlass>
              <div className="settings-item flex items-center justify-between cursor-pointer hover:bg-white/[0.02] rounded-lg transition-colors py-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-[var(--forex-muted)]">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium">About</div>
                    <div className="text-[9px] text-[var(--forex-muted)]">Version 3.0.0</div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--forex-muted)]" />
              </div>
            </LiquidGlass>
          </div>
        </div>

        <div className="glow-divider" />

        {/* Data & Privacy */}
        <div className="settings-section px-3 md:px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <HardDrive className="w-3.5 h-3.5 text-[var(--forex-accent)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--forex-muted)]">Data & Privacy</span>
          </div>
          <div className="space-y-1">
            <LiquidGlass>
              <div className="settings-item flex items-center justify-between cursor-pointer hover:bg-white/[0.02] rounded-lg transition-colors py-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-[var(--forex-muted)]">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium">Export Data</div>
                    <div className="text-[9px] text-[var(--forex-muted)]">Download trade history</div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--forex-muted)]" />
              </div>
            </LiquidGlass>

            <LiquidGlass>
              <div className="settings-item flex items-center justify-between cursor-pointer hover:bg-white/[0.02] rounded-lg transition-colors py-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-[var(--forex-muted)]">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium">Clear Cache</div>
                    <div className="text-[9px] text-[var(--forex-muted)]">Free up local storage</div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--forex-muted)]" />
              </div>
            </LiquidGlass>

            <LiquidGlass>
              <div className="settings-item flex items-center justify-between cursor-pointer hover:bg-white/[0.02] rounded-lg transition-colors py-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-[var(--forex-muted)]">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium">AI Training Data</div>
                    <div className="text-[9px] text-[var(--forex-muted)]">{memoryCount} memory entries stored</div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--forex-muted)]" />
              </div>
            </LiquidGlass>
          </div>
        </div>

        <div className="glow-divider" />

        {/* Danger Zone */}
        <div className="px-3 md:px-4 py-3 pb-6">
          <LiquidGlass>
            <button className="btn-3d w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--loss)]/10 border border-[var(--loss)]/20 text-[var(--loss)] hover:bg-[var(--loss)]/15 transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-semibold">Sign Out</span>
            </button>
          </LiquidGlass>
        </div>
      </div>
    </div>
  );
}
