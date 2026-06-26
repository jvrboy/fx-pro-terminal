'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Wifi, Wallet, WifiOff, Brain, Bell } from 'lucide-react';
import InteractiveBackground from '@/components/forex/InteractiveBackground';
import NavigationTabs from '@/components/forex/NavigationTabs';
import LiquidGlass from '@/components/forex/LiquidGlass';
import ChatTab from '@/components/forex/ChatTab';
import SignalsTab from '@/components/forex/SignalsTab';
import HistoryTab from '@/components/forex/HistoryTab';
import EconomicCalendarTab from '@/components/forex/EconomicCalendarTab';
import MarketOverviewTab from '@/components/forex/MarketOverviewTab';
import SettingsTab from '@/components/forex/SettingsTab';
import { useForexStore } from '@/lib/store';
import { useSocketIO } from '@/hooks/useSocketIO';
import ToastContainer from '@/components/forex/ToastContainer';
import { NotificationCenter, useNotificationCenter } from '@/components/forex/NotificationCenter';

function useClock() {
  const [time, setTime] = useState('--:--:--');
  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function LivePing() {
  const [ping, setPing] = useState(12);
  useEffect(() => {
    const id = setInterval(() => {
      setPing(Math.floor(8 + Math.random() * 12));
    }, 3000);
    return () => clearInterval(id);
  }, []);
  return ping;
}

function useMarketSessions() {
  const [sessions, setSessions] = useState([
    { name: 'Sydney', status: 'open' as const, time: '' },
    { name: 'Tokyo', status: 'open' as const, time: '' },
    { name: 'London', status: 'closed' as const, time: '' },
    { name: 'New York', status: 'closed' as const, time: '' },
  ]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const utcH = now.getUTCHours();

      const getSessionStatus = (openH: number, closeH: number) => {
        if (closeH > openH) return utcH >= openH && utcH < closeH;
        return utcH >= openH || utcH < closeH;
      };

      setSessions([
        { name: 'Sydney', status: getSessionStatus(21, 6) ? 'open' : 'closed', time: 'AEST' },
        { name: 'Tokyo', status: getSessionStatus(0, 9) ? 'open' : 'closed', time: 'JST' },
        { name: 'London', status: getSessionStatus(7, 16) ? 'open' : 'closed', time: 'BST' },
        { name: 'New York', status: getSessionStatus(12, 21) ? 'open' : 'closed', time: 'EST' },
      ]);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  return sessions;
}

function useAgentPolling() {
  const { setAgentStatus } = useForexStore();
  const agentRef = useRef(false);

  useEffect(() => {
    if (agentRef.current) return;
    agentRef.current = true;

    const poll = async () => {
      try {
        const res = await fetch('/api/agents');
        if (res.ok) {
          const data = await res.json();
          setAgentStatus(data);
        }
      } catch {
        // silent
      }
    };

    poll();
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, []);
}

function Header() {
  const time = useClock();
  const ping = LivePing();
  const { socketConnected, agentStatus } = useForexStore();
  const sessions = useMarketSessions();
  const activeSessions = sessions.filter(s => s.status === 'open').length;
  const agentRunning = agentStatus?.signalMonitor?.running;
  const notifPanel = useNotificationCenter();

  return (
    <header className="relative z-20 px-3 py-2 md:px-4 md:py-3 safe-top">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-[var(--forex-accent)]/20 to-[var(--gold)]/20 flex items-center justify-center border border-white/[0.08] liquid-shine noise-overlay">
            <Activity className="w-4 h-4 md:w-[18px] md:h-[18px] text-[var(--forex-accent)]" />
          </div>
          <div>
            <h1 className="text-xs md:text-sm font-bold tracking-tight leading-tight">FX PRO TERMINAL</h1>
            <div className="flex items-center gap-1.5">
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                animate={socketConnected ? { backgroundColor: ['var(--profit)'] } : { backgroundColor: ['var(--forex-muted)'] }}
                transition={{ duration: 1 }}
              />
              <span className="text-[8px] md:text-[9px] text-[var(--forex-muted)] font-medium uppercase tracking-widest">
                {socketConnected ? 'Live Market' : 'Connecting...'}
              </span>
              {agentRunning && (
                <span className="hidden sm:inline text-[8px] text-[var(--gold)] font-medium uppercase">
                  AI Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Agent indicator */}
          {agentRunning && (
            <div className="hidden sm:flex action-pill rounded-lg px-2 py-1 items-center gap-1">
              <Brain className="w-3 h-3 text-[var(--gold)]" />
              <span className="text-[9px] font-mono text-[var(--gold)]">AI</span>
            </div>
          )}
          {/* Account balance - visible on md+ */}
          <div className="hidden md:flex action-pill rounded-lg px-2.5 py-1.5 items-center gap-1.5">
            <Wallet className="w-3 h-3 text-[var(--gold)]" />
            <span className="text-[10px] font-mono font-bold text-[var(--forex-text)]">$24,831.50</span>
            <span className="text-[9px] font-mono text-[var(--profit)]">+2.4%</span>
          </div>
          {/* Ping + Clock */}
          <div className="action-pill rounded-lg px-1.5 py-1 md:px-2 md:py-1.5 flex items-center gap-1">
            {socketConnected
              ? <Wifi className="w-3 h-3 text-[var(--profit)]" />
              : <WifiOff className="w-3 h-3 text-[var(--loss)]" />
            }
            <span className="text-[9px] md:text-[10px] font-mono font-semibold text-[var(--forex-muted)]">{ping}</span>
          </div>
          <div className="action-pill rounded-lg px-1.5 py-1 md:px-2.5 md:py-1.5">
            <span className="text-[9px] md:text-[10px] font-mono font-semibold text-[var(--forex-text)] tabular-nums">
              {time}
            </span>
          </div>
          {/* Notification bell */}
          <div className="relative">
            <LiquidGlass>
              <button
                onClick={notifPanel.toggle}
                className="action-pill rounded-lg px-1.5 py-1 md:px-2 md:py-1.5 flex items-center gap-1 relative"
              >
                <Bell className="w-3 h-3 text-[var(--forex-muted)]" />
                {notifPanel.unreadCount > 0 && (
                  <motion.span
                    key={notifPanel.unreadCount}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--forex-accent)] text-[7px] font-bold text-black flex items-center justify-center leading-none"
                  >
                    {notifPanel.unreadCount}
                  </motion.span>
                )}
              </button>
            </LiquidGlass>
            <NotificationCenter
              isOpen={notifPanel.isOpen}
              onClose={notifPanel.close}
              unreadCount={notifPanel.unreadCount}
              notifications={notifPanel.notifications}
              onDismiss={notifPanel.handleDismiss}
              onMarkAllRead={notifPanel.handleMarkAllRead}
              onSetCategory={notifPanel.setActiveCategory}
              activeCategory={notifPanel.activeCategory}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

const tabComponents: Record<string, React.ComponentType> = {
  chat: ChatTab,
  signals: SignalsTab,
  history: HistoryTab,
  economy: EconomicCalendarTab,
  market: MarketOverviewTab,
  settings: SettingsTab,
};

export default function ForexApp() {
  const { activeTab, setSendChatMessage } = useForexStore();
  const ActiveTabComponent = tabComponents[activeTab] || SignalsTab;

  const { sendChatMessage } = useSocketIO();

  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      setSendChatMessage(sendChatMessage);
    }
  }, []);

  // Poll agent status
  useAgentPolling();

  return (
    <>
    <InteractiveBackground>
      {/* Animated top gradient bar */}
      <div className="gradient-top-bar" />

      <div className="flex justify-center min-h-screen">
        <div className="flex flex-col w-full max-w-[480px] lg:max-w-[520px] h-screen relative corner-bracket">
          {/* Decorative side panels on large screens */}
          <div className="hidden lg:block fixed left-0 top-0 bottom-0 w-[calc(50%-260px)] z-0">
            <div className="h-full flex flex-col justify-center items-center gap-8 px-8 opacity-30">
              <div className="text-right w-full">
                <div className="text-[10px] text-[var(--forex-muted)] uppercase tracking-widest mb-1">Session High</div>
                <div className="text-xl font-bold font-mono text-[var(--profit)]">1.0892</div>
              </div>
              <div className="text-right w-full">
                <div className="text-[10px] text-[var(--forex-muted)] uppercase tracking-widest mb-1">Volume</div>
                <div className="text-xl font-bold font-mono">1.42B</div>
              </div>
              <div className="text-right w-full">
                <div className="text-[10px] text-[var(--forex-muted)] uppercase tracking-widest mb-1">Spread</div>
                <div className="text-xl font-bold font-mono">0.2</div>
              </div>
            </div>
          </div>
          <div className="hidden lg:block fixed right-0 top-0 bottom-0 w-[calc(50%-260px)] z-0">
            <div className="h-full flex flex-col justify-center items-center gap-8 px-8 opacity-30">
              <div className="text-left w-full">
                <div className="text-[10px] text-[var(--forex-muted)] uppercase tracking-widest mb-1">Session Low</div>
                <div className="text-xl font-bold font-mono text-[var(--loss)]">1.0834</div>
              </div>
              <div className="text-left w-full">
                <div className="text-[10px] text-[var(--forex-muted)] uppercase tracking-widest mb-1">VIX</div>
                <div className="text-xl font-bold font-mono">14.8</div>
              </div>
              <div className="text-left w-full">
                <div className="text-[10px] text-[var(--forex-muted)] uppercase tracking-widest mb-1">DXY</div>
                <div className="text-xl font-bold font-mono">104.2</div>
              </div>
            </div>
          </div>

          {/* Header */}
          <Header />

          {/* Glow line below header */}
          <div className="glow-line" />

          {/* Main Content */}
          <main className="flex-1 overflow-hidden relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="h-full"
              >
                <ActiveTabComponent />
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Navigation */}
          <NavigationTabs />
        </div>
      </div>
    </InteractiveBackground>
    <ToastContainer />
    </>
  );
}
