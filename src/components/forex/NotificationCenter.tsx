'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  TrendingUp,
  ArrowLeftRight,
  Newspaper,
  Settings,
  ShieldAlert,
  Target,
  X,
  CheckCheck,
  ExternalLink,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onMarkAllRead: () => void;
  onSetCategory: (cat: NotificationCategory) => void;
  activeCategory: NotificationCategory;
}

type NotificationType = 'signal' | 'trade' | 'news' | 'system';
type NotificationCategory = 'All' | 'Signals' | 'Economy' | 'System';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
}

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'signal',
    title: 'EUR/USD Buy Signal',
    description: 'RSI oversold + bullish engulfing at 1.0845 support level',
    timestamp: '2m ago',
    unread: true,
  },
  {
    id: '2',
    type: 'trade',
    title: 'GBP/USD Trade Executed',
    description: 'Sold 0.5 lots at 1.2720 — stop-loss at 1.2760',
    timestamp: '5m ago',
    unread: true,
  },
  {
    id: '3',
    type: 'news',
    title: 'US NFP Report Released',
    description: 'Non-farm payrolls came in at 216K vs 200K expected',
    timestamp: '12m ago',
    unread: true,
  },
  {
    id: '4',
    type: 'signal',
    title: 'USD/JPY Bearish Divergence',
    description: 'MACD divergence on H4 — potential reversal zone 158.40',
    timestamp: '15m ago',
    unread: true,
  },
  {
    id: '5',
    type: 'system',
    title: 'SL Hit — AUD/USD',
    description: 'Stop-loss triggered at 0.6512 for a −38 pip loss',
    timestamp: '32m ago',
    unread: false,
  },
  {
    id: '6',
    type: 'trade',
    title: 'TP Hit — EUR/GBP',
    description: 'Take-profit reached at 0.8540 — +24 pips locked in',
    timestamp: '1h ago',
    unread: false,
  },
  {
    id: '7',
    type: 'news',
    title: 'ECB Rate Decision',
    description: 'European Central Bank holds rates at 4.5% as expected',
    timestamp: '1h ago',
    unread: false,
  },
  {
    id: '8',
    type: 'system',
    title: 'System Update v2.4.1',
    description: 'New candlestick patterns added — please refresh the page',
    timestamp: '2h ago',
    unread: false,
  },
  {
    id: '9',
    type: 'signal',
    title: 'USD/CHF Breakout Alert',
    description: 'Resistance broken at 0.8890 with increased volume',
    timestamp: '3h ago',
    unread: false,
  },
  {
    id: '10',
    type: 'trade',
    title: 'USD/CAD Position Closed',
    description: 'Closed manually at 1.3685 for +52 pips profit',
    timestamp: '5h ago',
    unread: false,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_ICON: Record<NotificationType, typeof TrendingUp> = {
  signal: TrendingUp,
  trade: ArrowLeftRight,
  news: Newspaper,
  system: Settings,
};

const TYPE_COLOR: Record<NotificationType, string> = {
  signal: 'text-[var(--forex-accent)]',
  trade: 'text-[var(--gold)]',
  news: 'text-[var(--gold)]',
  system: 'text-[var(--forex-muted)]',
};

const TYPE_BG: Record<NotificationType, string> = {
  signal: 'bg-[var(--forex-accent)]/10',
  trade: 'bg-amber-500/10',
  news: 'bg-amber-500/10',
  system: 'bg-white/5',
};

const TYPE_BORDER: Record<NotificationType, string> = {
  signal: 'border-l-[var(--forex-accent)]',
  trade: 'border-l-[var(--gold)]',
  news: 'border-l-[var(--gold)]',
  system: 'border-l-[var(--forex-muted)]',
};

const CATEGORY_FILTER: Record<NotificationCategory, NotificationType | null> = {
  All: null,
  Signals: 'signal',
  Economy: 'news',
  System: 'system',
};

const CATEGORIES: NotificationCategory[] = ['All', 'Signals', 'Economy', 'System'];

// Map notification types to category filter for backward compatibility
function matchesCategory(type: NotificationType, category: NotificationCategory): boolean {
  if (category === 'All') return true;
  if (category === 'Signals') return type === 'signal';
  if (category === 'Economy') return type === 'news' || type === 'trade';
  if (category === 'System') return type === 'system';
  return true;
}

// ---------------------------------------------------------------------------
// Hook — manages notification state so header badge can access unreadCount
// ---------------------------------------------------------------------------

let idCounter = 0;
export function useNotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('All');
  const idRef = useRef(++idCounter);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, unread: false })),
    );
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const filtered = activeCategory === 'All'
    ? notifications
    : notifications.filter((n) => matchesCategory(n.type, activeCategory));

  return {
    isOpen,
    toggle,
    close,
    unreadCount,
    notifications: filtered,
    allNotifications: notifications,
    handleMarkAllRead,
    handleDismiss,
    activeCategory,
    setActiveCategory,
    idRef,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationCenter({
  isOpen,
  onClose,
  unreadCount,
  notifications,
  onDismiss,
  onMarkAllRead,
  onSetCategory,
  activeCategory,
}: NotificationCenterProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        onClose();
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const isEmpty = notifications.length === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="notification-panel"
          ref={panelRef}
          className="absolute top-full right-0 z-50 mt-2"
          style={{ width: 'min(400px, calc(100vw - 32px))' }}
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        >
          {/* Caret / arrow */}
          <div
            className="absolute -top-2 right-5 w-4 h-4 rotate-45 border-t border-l glass-deep"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            aria-hidden
          />

          {/* Panel */}
          <div className="glass-deep rounded-xl shadow-2xl shadow-black/40 overflow-hidden border border-white/[0.08]">
            {/* ---- Header ---- */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[var(--forex-accent)]" />
                <h3 className="text-sm font-semibold text-[var(--forex-text)]">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <motion.span
                    key={unreadCount}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="mini-stat text-[10px] leading-none font-bold px-1.5 py-0.5 rounded-full bg-[var(--forex-accent)] text-black"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </div>
              <button
                onClick={onMarkAllRead}
                disabled={unreadCount === 0}
                className="flex items-center gap-1 text-xs text-[var(--forex-muted)] hover:text-[var(--forex-text)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <CheckCheck size={13} />
                Mark All Read
              </button>
            </div>

            {/* ---- Filter tabs ---- */}
            <div className="flex gap-1.5 px-4 pb-3">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => onSetCategory(cat)}
                    className={`
                      relative px-3 py-1 rounded-full text-xs font-medium transition-all
                      ${
                        isActive
                          ? 'bg-[var(--forex-accent)]/20 text-[var(--forex-accent)] border border-[var(--forex-accent)]/30'
                          : 'bg-white/5 text-[var(--forex-muted)] border border-white/[0.06] hover:bg-white/10 hover:text-[var(--forex-text)]'
                      }
                    `}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* ---- Divider ---- */}
            <div className="h-px bg-white/[0.06]" />

            {/* ---- Notification list ---- */}
            <div className="max-h-[420px] overflow-y-auto forex-scrollbar">
              {isEmpty ? (
                <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                  <BellOff size={32} className="text-white/15 mb-3" />
                  <p className="text-sm text-[var(--forex-muted)]">
                    No notifications
                  </p>
                  <p className="text-xs text-white/25 mt-1">
                    Alerts about signals, economy, and system will appear here
                  </p>
                </div>
              ) : (
                <ul>
                  <AnimatePresence initial={false}>
                    {notifications.map((notification) => {
                      const Icon = TYPE_ICON[notification.type];
                      const colorClass = TYPE_COLOR[notification.type];
                      const bgClass = TYPE_BG[notification.type];
                      const borderClass = TYPE_BORDER[notification.type];

                      return (
                        <motion.li
                          key={notification.id}
                          layout
                          initial={{ opacity: 0, y: -16, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -8, height: 0 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          className="relative"
                          onMouseEnter={() => setHoveredId(notification.id)}
                          onMouseLeave={() => setHoveredId(null)}
                        >
                          <div
                            className={`
                              flex items-start gap-3 px-4 py-3 transition-colors cursor-default
                              border-l-[3px] ${borderClass}
                              ${notification.unread ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}
                            `}
                          >
                            {/* Unread dot */}
                            {notification.unread && (
                              <span className="absolute left-[3px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--forex-accent)] shrink-0 -ml-1" style={{ left: '1px' }} />
                            )}

                            {/* Icon */}
                            <div
                              className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 ${bgClass}`}
                            >
                              <Icon size={14} className={colorClass} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-semibold truncate ${
                                    notification.unread ? 'text-white' : 'text-white/70'
                                  }`}
                                >
                                  {notification.title}
                                </span>
                                {/* Special SL/TP indicators */}
                                {notification.type === 'system' && (
                                  notification.description.toLowerCase().includes('stop-loss')
                                    ? <ShieldAlert size={12} className="text-[var(--loss)] shrink-0" />
                                    : null
                                )}
                                {notification.type === 'trade' && (
                                  notification.description.toLowerCase().includes('take-profit')
                                    ? <Target size={12} className="text-[var(--profit)] shrink-0" />
                                    : null
                                )}
                              </div>
                              <p className="text-[11px] text-[var(--forex-muted)] truncate mt-0.5">
                                {notification.description}
                              </p>

                              {/* Action buttons for signal notifications */}
                              {notification.type === 'signal' && (
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-semibold bg-[var(--forex-accent)]/15 text-[var(--forex-accent)] border border-[var(--forex-accent)]/20 hover:bg-[var(--forex-accent)]/25 transition-colors"
                                  >
                                    <Eye size={10} />
                                    View Signal
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDismiss(notification.id);
                                    }}
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-semibold bg-white/[0.04] text-[var(--forex-muted)] border border-white/[0.06] hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/20 transition-colors"
                                  >
                                    <EyeOff size={10} />
                                    Dismiss
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Timestamp + Dismiss */}
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className="text-[10px] text-white/25 whitespace-nowrap mt-0.5">
                                {notification.timestamp}
                              </span>
                              {/* Delete button on hover (non-signal types) */}
                              {notification.type !== 'signal' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDismiss(notification.id);
                                  }}
                                  className={`
                                    shrink-0 w-6 h-6 rounded-md flex items-center justify-center
                                    transition-all
                                    ${
                                      hoveredId === notification.id
                                        ? 'opacity-100 bg-white/10 hover:bg-red-500/20 hover:text-red-400'
                                        : 'opacity-0'
                                    }
                                    text-white/40
                                  `}
                                  aria-label="Dismiss notification"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Divider between notifications */}
                          <div className="h-px bg-white/[0.04]" />
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* ---- Divider ---- */}
            {!isEmpty && <div className="h-px bg-white/[0.06]" />}

            {/* ---- Footer ---- */}
            <div className="px-4 py-3">
              <button
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 w-full text-xs font-medium text-[var(--forex-accent)] hover:text-[var(--forex-accent)]/80 transition-colors"
              >
                View All
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}