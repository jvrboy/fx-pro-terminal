'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  TrendingUp,
  Clock,
  Settings,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { useForexStore, type TabId } from '@/lib/store';
import { useSound } from '@/lib/sounds';
import LiquidGlass from './LiquidGlass';

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  hasBadge?: boolean;
}

const navItems: NavItem[] = [
  {
    id: 'chat',
    label: 'Chat',
    icon: <MessageSquare className="w-[16px] h-[16px]" />,
  },
  {
    id: 'signals',
    label: 'Signals',
    icon: <TrendingUp className="w-[16px] h-[16px]" />,
    hasBadge: true,
  },
  {
    id: 'history',
    label: 'History',
    icon: <Clock className="w-[16px] h-[16px]" />,
  },
  {
    id: 'economy',
    label: 'Economy',
    icon: <Calendar className="w-[16px] h-[16px]" />,
  },
  {
    id: 'market',
    label: 'Market',
    icon: <BarChart3 className="w-[16px] h-[16px]" />,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-[16px] h-[16px]" />,
  },
];

export default function NavigationTabs() {
  const { activeTab, setActiveTab, notifications, socketConnected } = useForexStore();
  const { play } = useSound();
  const [pressedTab, setPressedTab] = useState<string | null>(null);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom flex justify-center">
      <div className="corner-bracket-full nav-frosted w-full max-w-[480px] lg:max-w-[520px] mx-0 mb-0 rounded-t-2xl border-b-0 border-x-0 relative overflow-hidden">
        {/* Decorative corner brackets */}
        <div className="corner-br-tr" />
        <div className="corner-br-bl" />
        {/* Animated connection line */}
        <div className="flex items-center justify-center py-0.5">
          <motion.div
            className="h-[2px] rounded-full"
            animate={socketConnected ? {
              backgroundColor: ['var(--forex-accent)', 'var(--profit)', 'var(--gold)', 'var(--forex-accent)'],
            } : {
              backgroundColor: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: socketConnected ? '100%' : '40%',
              marginLeft: socketConnected ? '0' : '30%',
              marginRight: socketConnected ? '0' : '30%',
              boxShadow: socketConnected ? '0 0 12px rgba(114, 198, 157, 0.4), 0 0 24px rgba(114, 198, 157, 0.15)' : 'none',
            }}
          />
        </div>
        <div className="flex items-center justify-around px-0.5 py-0.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <LiquidGlass key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    play('click');
                    setPressedTab(item.id);
                    setTimeout(() => setPressedTab(null), 200);
                  }}
                  className={`nav-tab-3d relative flex flex-col items-center gap-0.5 py-1.5 px-1.5 sm:px-2.5 rounded-xl transition-all duration-300 ${
                    isActive ? 'active' : 'hover:bg-white/[0.03]'
                  } ${pressedTab === item.id ? 'scale-[0.95]' : ''}`}
                >
                  <div className="tab-icon-wrapper relative">
                    <AnimatePresence mode="wait">
                      {isActive && (
                        <motion.div
                          layoutId="activeTabBg"
                          className="absolute inset-0 -m-1 rounded-xl bg-white/[0.06] breathe-glow"
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>
                    {/* Icon glow effect when active */}
                    <motion.span
                      className={`relative z-10 transition-all duration-300 ${
                        isActive ? 'text-[var(--forex-accent)] drop-shadow-[0_0_8px_rgba(114,198,157,0.5)]' : 'text-[var(--forex-muted)]'
                      }`}
                      animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.05 }}
                    >
                      {item.icon}
                    </motion.span>
                  </div>

                  <span className={`text-[8px] sm:text-[9px] font-semibold tracking-[0.05em] uppercase transition-all duration-300 ${
                    isActive ? 'text-[var(--forex-accent)]' : 'text-[var(--forex-muted)]'
                  }`}>
                    {item.label}
                  </span>

                  {/* Notification badge */}
                  {item.id === 'signals' && notifications > 0 && (
                    <motion.div
                      className="absolute top-0 right-0 min-w-[12px] h-[12px] rounded-full bg-[var(--loss)] flex items-center justify-center px-0.5 badge-live"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, delay: 0.1 }}
                      style={{ boxShadow: '0 0 8px rgba(220,80,60,0.4)' }}
                    >
                      <span className="text-[7px] font-bold text-white leading-none">{notifications}</span>
                    </motion.div>
                  )}

                  {/* Unread dot for chat */}
                  {item.id === 'chat' && (
                    <motion.div
                      className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--forex-accent)] badge-live"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                      style={{ boxShadow: '0 0 6px rgba(114,198,157,0.5)' }}
                    />
                  )}
                </button>
              </LiquidGlass>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
