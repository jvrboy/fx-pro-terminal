'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Clock,
  Zap,
  ArrowUp,
  ArrowDown,
  Globe,
  BarChart3,
  TrendingUp,
  RefreshCw,
  X,
  Star,
  ChevronDown,
} from 'lucide-react';
import LiquidGlass from './LiquidGlass';
import { useForexStore } from '@/lib/store';
import type { EconomicEvent } from '@/types/forex';

/* ────────────────────────────── helpers ────────────────────────────── */

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateDisplay(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function parseTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const currencyColors: Record<string, string> = {
  USD: '#22c55e',
  EUR: '#3b82f6',
  GBP: '#a855f7',
  JPY: '#ef4444',
  AUD: '#f59e0b',
  CAD: '#ec4899',
  NZD: '#06b6d4',
  CHF: '#f97316',
};

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'NZD', 'CHF'] as const;
const IMPACTS = ['High', 'Medium', 'Low'] as const;
const STATUSES = ['Upcoming', 'Released', 'Historical'] as const;

/* ──────────────────── realistic event dataset ──────────────────── */

function generateEvents(): EconomicEvent[] {
  const now = new Date();
  const today = toDateString(now);
  const yesterday = toDateString(new Date(now.getTime() - 86400000));
  const twoDaysAgo = toDateString(new Date(now.getTime() - 2 * 86400000));
  const tomorrow = toDateString(new Date(now.getTime() + 86400000));
  const twoDaysAhead = toDateString(new Date(now.getTime() + 2 * 86400000));
  const threeDaysAhead = toDateString(new Date(now.getTime() + 3 * 86400000));

  const h = (hour: number, dateStr: string) => {
    const d = new Date(dateStr + 'T' + String(hour).padStart(2, '0') + ':' + String(Math.floor(Math.random() * 60)).padStart(2, '0') + ':00');
    return d.toISOString();
  };

  const pastDate = yesterday;
  const histDate = twoDaysAgo;

  const events: EconomicEvent[] = [
    // ── Today ──
    { id: 'e1', eventDate: today, currency: 'USD', impact: 'high', title: 'Non-Farm Payrolls', description: 'Change in the number of people employed during the previous month, excluding the farming industry.', actual: '206K', forecast: '190K', previous: '216K', category: 'Employment', source: 'BLS', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e2', eventDate: today, currency: 'USD', impact: 'high', title: 'CPI m/m', description: 'Consumer Price Index measures changes in the price of goods and services.', actual: '2.4%', forecast: '2.3%', previous: '2.5%', category: 'Inflation', source: 'BLS', status: 'released', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e3', eventDate: today, currency: 'USD', impact: 'medium', title: 'Jobless Claims', description: 'Number of individuals who filed for unemployment insurance for the first time.', actual: '220K', forecast: '215K', previous: '208K', category: 'Employment', source: 'DOL', status: 'released', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e4', eventDate: today, currency: 'EUR', impact: 'high', title: 'ECB Interest Rate Decision', description: 'European Central Bank announces its interest rate decision.', actual: null, forecast: '3.65%', previous: '3.65%', category: 'Monetary Policy', source: 'ECB', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e5', eventDate: today, currency: 'GBP', impact: 'high', title: 'GDP q/q', description: 'Gross Domestic Product measures the total value of goods and services produced.', actual: '0.3%', forecast: '0.3%', previous: '0.1%', category: 'GDP', source: 'ONS', status: 'released', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e6', eventDate: today, currency: 'JPY', impact: 'medium', title: 'BOJ Policy Statement', description: 'Bank of Japan releases its monetary policy statement.', actual: null, forecast: '-0.10%', previous: '-0.10%', category: 'Monetary Policy', source: 'BOJ', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e7', eventDate: today, currency: 'AUD', impact: 'medium', title: 'Retail Sales m/m', description: 'Measures changes in the total value of sales at the retail level.', actual: '0.5%', forecast: '0.3%', previous: '0.4%', category: 'Trade', source: 'ABS', status: 'released', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e8', eventDate: today, currency: 'CAD', impact: 'low', title: 'Trade Balance', description: 'Difference between exports and imports of goods and services.', actual: null, forecast: '-1.2B', previous: '-1.5B', category: 'Trade', source: 'Statistics Canada', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e9', eventDate: today, currency: 'USD', impact: 'low', title: 'Factory Orders m/m', description: 'Measures the total value of new purchase orders placed with manufacturers.', actual: '1.2%', forecast: '1.0%', previous: '0.8%', category: 'Manufacturing', source: 'Census Bureau', status: 'released', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e10', eventDate: today, currency: 'CHF', impact: 'low', title: 'CPI y/y', description: 'Swiss Consumer Price Index year-over-year change.', actual: '1.4%', forecast: '1.3%', previous: '1.2%', category: 'Inflation', source: 'FSO', status: 'released', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e11', eventDate: today, currency: 'NZD', impact: 'medium', title: 'ANZ Commodity Prices', description: 'ANZ commodity price index tracks changes in world prices of key commodities.', actual: null, forecast: '0.8%', previous: '1.1%', category: 'Trade', source: 'ANZ', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // ── Yesterday ──
    { id: 'e12', eventDate: yesterday, currency: 'USD', impact: 'high', title: 'FOMC Meeting Minutes', description: 'Detailed record of the Federal Open Market Committee policy meeting.', actual: 'Hawkish', forecast: null, previous: 'Neutral', category: 'Monetary Policy', source: 'Fed', status: 'released', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e13', eventDate: yesterday, currency: 'EUR', impact: 'high', title: 'German Manufacturing PMI', description: 'Purchasing Managers Index for the German manufacturing sector.', actual: '42.5', forecast: '42.0', previous: '41.8', category: 'Manufacturing', source: 'S&P Global', status: 'released', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e14', eventDate: yesterday, currency: 'GBP', impact: 'medium', title: 'Employment Change', description: 'Change in the number of people in employment in the UK.', actual: '72K', forecast: '65K', previous: '58K', category: 'Employment', source: 'ONS', status: 'released', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e15', eventDate: yesterday, currency: 'JPY', impact: 'high', title: 'GDP q/q', description: 'Japan Gross Domestic Product quarter-over-quarter annualized change.', actual: '-0.3%', forecast: '-0.1%', previous: '0.1%', category: 'GDP', source: 'Cabinet Office', status: 'released', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e16', eventDate: yesterday, currency: 'AUD', impact: 'low', title: 'NAB Business Confidence', description: 'National Australia Bank survey of business confidence.', actual: '4', forecast: '2', previous: '3', category: 'Employment', source: 'NAB', status: 'released', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e17', eventDate: yesterday, currency: 'CAD', impact: 'high', title: 'BOC Interest Rate Decision', description: 'Bank of Canada announces its interest rate decision.', actual: '4.50%', forecast: '4.50%', previous: '4.75%', category: 'Monetary Policy', source: 'BOC', status: 'released', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e18', eventDate: yesterday, currency: 'CHF', impact: 'medium', title: 'SNB Interest Rate Decision', description: 'Swiss National Bank announces its interest rate decision.', actual: '1.50%', forecast: '1.50%', previous: '1.75%', category: 'Monetary Policy', source: 'SNB', status: 'released', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // ── Two days ago (historical) ──
    { id: 'e19', eventDate: twoDaysAgo, currency: 'USD', impact: 'high', title: 'ADP Non-Farm Employment', description: 'Estimated change in private sector employment.', actual: '152K', forecast: '160K', previous: '111K', category: 'Employment', source: 'ADP', status: 'historical', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e20', eventDate: twoDaysAgo, currency: 'EUR', impact: 'medium', title: 'French Services PMI', description: 'Purchasing Managers Index for French services sector.', actual: '48.8', forecast: '48.2', previous: '47.8', category: 'Manufacturing', source: 'S&P Global', status: 'historical', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e21', eventDate: twoDaysAgo, currency: 'GBP', impact: 'low', title: 'BRC Retail Sales y/y', description: 'British Retail Consortium retail sales monitor year-over-year.', actual: '-1.3%', forecast: '-0.8%', previous: '0.5%', category: 'Trade', source: 'BRC', status: 'historical', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e22', eventDate: twoDaysAgo, currency: 'NZD', impact: 'high', title: 'RBNZ Interest Rate Decision', description: 'Reserve Bank of New Zealand interest rate decision.', actual: '5.50%', forecast: '5.50%', previous: '5.50%', category: 'Monetary Policy', source: 'RBNZ', status: 'historical', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // ── Tomorrow ──
    { id: 'e23', eventDate: tomorrow, currency: 'USD', impact: 'medium', title: 'ISM Services PMI', description: 'Institute for Supply Management services sector index.', actual: null, forecast: '52.5', previous: '51.4', category: 'Manufacturing', source: 'ISM', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e24', eventDate: tomorrow, currency: 'EUR', impact: 'medium', title: 'German Industrial Production m/m', description: 'Measures the change in the total inflation-adjusted value of output produced.', actual: null, forecast: '0.2%', previous: '-0.4%', category: 'Manufacturing', source: 'Destatis', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e25', eventDate: tomorrow, currency: 'GBP', impact: 'high', title: 'BOE Interest Rate Decision', description: 'Bank of England announces its interest rate decision.', actual: null, forecast: '5.25%', previous: '5.25%', category: 'Monetary Policy', source: 'BOE', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e26', eventDate: tomorrow, currency: 'JPY', impact: 'medium', title: 'Current Account', description: 'Difference between the value of exports and imports of goods and services.', actual: null, forecast: '2.8T', previous: '2.5T', category: 'Trade', source: 'MOF', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e27', eventDate: tomorrow, currency: 'AUD', impact: 'low', title: 'MI Inflation Expectations', description: 'Melbourne Institute inflation expectations survey.', actual: null, forecast: '3.8%', previous: '3.7%', category: 'Inflation', source: 'MI', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e28', eventDate: tomorrow, currency: 'CAD', impact: 'medium', title: 'Building Permits m/m', description: 'Change in the number of new building permits issued.', actual: null, forecast: '2.0%', previous: '-3.5%', category: 'GDP', source: 'Statistics Canada', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e29', eventDate: tomorrow, currency: 'CHF', impact: 'low', title: 'Unemployment Rate', description: 'Swiss unemployment rate seasonally adjusted.', actual: null, forecast: '2.3%', previous: '2.2%', category: 'Employment', source: 'SECO', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // ── Two days ahead ──
    { id: 'e30', eventDate: twoDaysAhead, currency: 'USD', impact: 'high', title: 'Core PCE Price Index m/m', description: 'Federal Reserve preferred inflation gauge, excluding food and energy.', actual: null, forecast: '0.2%', previous: '0.3%', category: 'Inflation', source: 'BEA', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e31', eventDate: twoDaysAhead, currency: 'EUR', impact: 'low', title: 'Italian Trade Balance', description: 'Difference between Italian exports and imports of goods.', actual: null, forecast: '3.2B', previous: '2.8B', category: 'Trade', source: 'ISTAT', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e32', eventDate: twoDaysAhead, currency: 'GBP', impact: 'medium', title: 'Manufacturing Production m/m', description: 'Measures change in total inflation-adjusted value of output by manufacturers.', actual: null, forecast: '0.3%', previous: '-0.1%', category: 'Manufacturing', source: 'ONS', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e33', eventDate: twoDaysAhead, currency: 'NZD', impact: 'medium', title: 'GDP q/q', description: 'New Zealand gross domestic product quarter-over-quarter.', actual: null, forecast: '0.2%', previous: '-0.1%', category: 'GDP', source: 'Stats NZ', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // ── Three days ahead ──
    { id: 'e34', eventDate: threeDaysAhead, currency: 'USD', impact: 'high', title: 'Retail Sales m/m', description: 'Measures changes in the total value of sales at the retail level.', actual: null, forecast: '0.4%', previous: '0.6%', category: 'Trade', source: 'Census Bureau', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e35', eventDate: threeDaysAhead, currency: 'EUR', impact: 'high', title: 'ECB Press Conference', description: 'ECB President holds a press conference after the rate decision.', actual: null, forecast: null, previous: null, category: 'Monetary Policy', source: 'ECB', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e36', eventDate: threeDaysAhead, currency: 'JPY', impact: 'high', title: 'Trade Balance', description: 'Japanese trade balance, difference between exports and imports.', actual: null, forecast: '-320B', previous: '-461B', category: 'Trade', source: 'MOF', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e37', eventDate: threeDaysAhead, currency: 'AUD', impact: 'high', title: 'RBA Interest Rate Decision', description: 'Reserve Bank of Australia interest rate decision.', actual: null, forecast: '4.35%', previous: '4.35%', category: 'Monetary Policy', source: 'RBA', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e38', eventDate: threeDaysAhead, currency: 'CAD', impact: 'low', title: 'New Housing Price Index m/m', description: 'Measures changes in selling prices of new homes.', actual: null, forecast: '0.1%', previous: '0.0%', category: 'GDP', source: 'Statistics Canada', status: 'upcoming', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  // Assign realistic times to each event
  const timesByCurrency: Record<string, number[]> = {
    USD: [8, 8, 8, 10, 14, 15],
    EUR: [1, 2, 4, 5, 9, 10],
    GBP: [2, 7, 12, 14],
    JPY: [0, 19, 23, 5],
    AUD: [0, 1, 22, 1],
    CAD: [8, 13, 14],
    NZD: [21, 22, 1],
    CHF: [1, 3, 8],
  };

  return events.map((ev, i) => {
    const cTimes = timesByCurrency[ev.currency] || [12];
    const hour = cTimes[i % cTimes.length];
    const baseDate = new Date(ev.eventDate + 'T00:00:00');
    baseDate.setHours(hour, Math.floor((i * 17) % 60), 0, 0);
    return {
      ...ev,
      eventDate: baseDate.toISOString(),
    };
  });
}

const allEvents = generateEvents();

/* ────────────────────── Impact dot component ────────────────────── */

function ImpactDot({ impact }: { impact: 'high' | 'medium' | 'low' }) {
  const color = impact === 'high' ? 'bg-red-500' : impact === 'medium' ? 'bg-orange-400' : 'bg-yellow-400';
  const pulseClass = impact === 'high' ? 'pulse-dot' : '';
  return (
    <div className="flex items-center gap-1">
      {[...Array(impact === 'high' ? 3 : impact === 'medium' ? 2 : 1)].map((_, i) => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full ${color} ${i === 0 ? pulseClass : ''}`} />
      ))}
    </div>
  );
}

/* ──────────────────── Currency badge component ──────────────────── */

function CurrencyBadge({ currency }: { currency: string }) {
  const color = currencyColors[currency] || '#888';
  return (
    <div
      className="flex items-center justify-center w-[42px] h-[22px] rounded-md text-[9px] font-bold tracking-wider card-depth-1 shrink-0"
      style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}25` }}
    >
      {currency}
    </div>
  );
}

/* ════════════════════════════ MAIN COMPONENT ════════════════════════════ */

export default function EconomicCalendarTab() {
  const socketConnected = useForexStore((s) => s.socketConnected);

  // ── State ──
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCurrencies, setSelectedCurrencies] = useState<Set<string>>(new Set(CURRENCIES));
  const [selectedImpacts, setSelectedImpacts] = useState<Set<string>>(new Set(IMPACTS));
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set(STATUSES));
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [starredEvents, setStarredEvents] = useState<Set<string>>(new Set());

  // ── Date helpers ──
  const goToPrevDay = useCallback(() => {
    setSelectedDate((d) => new Date(d.getTime() - 86400000));
    setExpandedEvent(null);
  }, []);
  const goToNextDay = useCallback(() => {
    setSelectedDate((d) => new Date(d.getTime() + 86400000));
    setExpandedEvent(null);
  }, []);
  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
    setExpandedEvent(null);
  }, []);

  const isToday = toDateString(selectedDate) === toDateString(new Date());

  // ── Auto-refresh simulation ──
  useEffect(() => {
    const id = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          setIsRefreshing(true);
          setTimeout(() => setIsRefreshing(false), 600);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Toggle helpers ──
  const toggleCurrency = useCallback((c: string) => {
    setSelectedCurrencies((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }, []);

  const toggleImpact = useCallback((imp: string) => {
    setSelectedImpacts((prev) => {
      const next = new Set(prev);
      if (next.has(imp)) next.delete(imp);
      else next.add(imp);
      return next;
    });
  }, []);

  const toggleStatus = useCallback((s: string) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }, []);

  const toggleStar = useCallback((id: string) => {
    setStarredEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedCurrencies(new Set(CURRENCIES));
    setSelectedImpacts(new Set(IMPACTS));
    setSelectedStatuses(new Set(STATUSES));
    setSearchQuery('');
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCurrencies.size < CURRENCIES.length) count++;
    if (selectedImpacts.size < IMPACTS.length) count++;
    if (selectedStatuses.size < STATUSES.length) count++;
    if (searchQuery) count++;
    return count;
  }, [selectedCurrencies, selectedImpacts, selectedStatuses, searchQuery]);

  // ── Filter events for selected date ──
  const filteredEvents = useMemo(() => {
    const dateStr = toDateString(selectedDate);
    return allEvents
      .filter((ev) => toDateString(new Date(ev.eventDate)) === dateStr)
      .filter((ev) => selectedCurrencies.has(ev.currency))
      .filter((ev) => selectedImpacts.has(ev.impact.charAt(0).toUpperCase() + ev.impact.slice(1)))
      .filter((ev) => selectedStatuses.has(ev.status.charAt(0).toUpperCase() + ev.status.slice(1)))
      .filter((ev) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          ev.title.toLowerCase().includes(q) ||
          ev.currency.toLowerCase().includes(q) ||
          ev.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }, [selectedDate, selectedCurrencies, selectedImpacts, selectedStatuses, searchQuery]);

  // ── Summary stats ──
  const summary = useMemo(() => {
    const total = filteredEvents.length;
    const highImpact = filteredEvents.filter((e) => e.impact === 'high').length;
    const released = filteredEvents.filter((e) => e.status === 'released').length;
    const upcoming = filteredEvents.filter((e) => e.status === 'upcoming').length;

    // Simple sentiment based on actual vs forecast comparison for released events
    let positive = 0;
    let negative = 0;
    filteredEvents.forEach((ev) => {
      if (ev.actual && ev.forecast) {
        const actualNum = parseFloat(ev.actual.replace(/[%,K,B,T]/g, ''));
        const forecastNum = parseFloat(ev.forecast.replace(/[%,K,B,T]/g, ''));
        if (!isNaN(actualNum) && !isNaN(forecastNum)) {
          if (actualNum > forecastNum) positive++;
          else if (actualNum < forecastNum) negative++;
        }
      }
    });
    const sentiment = positive > negative ? 'bullish' : negative > positive ? 'bearish' : 'neutral';
    return { total, highImpact, released, upcoming, sentiment };
  }, [filteredEvents]);

  // ── Value comparison helper ──
  function getValueColor(actual: string | null, forecast: string | null): string {
    if (!actual || !forecast) return 'text-[var(--forex-text)]';
    const a = parseFloat(actual.replace(/[%,K,B,T]/g, ''));
    const f = parseFloat(forecast.replace(/[%,K,B,T]/g, ''));
    if (isNaN(a) || isNaN(f)) return 'text-[var(--forex-text)]';
    if (a > f) return 'text-[var(--profit)]';
    if (a < f) return 'text-[var(--loss)]';
    return 'text-[var(--forex-text)]';
  }

  function getValueDirection(actual: string | null, forecast: string | null): 'up' | 'down' | 'neutral' {
    if (!actual || !forecast) return 'neutral';
    const a = parseFloat(actual.replace(/[%,K,B,T]/g, ''));
    const f = parseFloat(forecast.replace(/[%,K,B,T]/g, ''));
    if (isNaN(a) || isNaN(f)) return 'neutral';
    if (a > f) return 'up';
    if (a < f) return 'down';
    return 'neutral';
  }

  // ── Category color ──
  function getCategoryStyle(category: string): string {
    const map: Record<string, string> = {
      Employment: 'bg-blue-500/15 text-blue-400',
      Inflation: 'bg-red-500/15 text-red-400',
      GDP: 'bg-emerald-500/15 text-emerald-400',
      'Monetary Policy': 'bg-purple-500/15 text-purple-400',
      Trade: 'bg-amber-500/15 text-amber-400',
      Manufacturing: 'bg-cyan-500/15 text-cyan-400',
    };
    return map[category] || 'bg-white/[0.06] text-[var(--forex-muted)]';
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Date Navigation ── */}
      <div className="px-4 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[var(--forex-accent)]" />
            <span className="text-sm font-semibold">Economic Calendar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                animate={socketConnected ? { backgroundColor: ['var(--profit)', '#72c69d', 'var(--profit)'] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                style={!socketConnected ? { backgroundColor: 'var(--forex-muted)' } : {}}
              />
              <span className="text-[9px] text-[var(--forex-muted)] font-medium">
                {isRefreshing ? 'SYNCING...' : `REFRESH ${refreshCountdown}s`}
              </span>
            </div>
            <LiquidGlass>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 600); setRefreshCountdown(30); }}
                className="btn-3d p-1.5 rounded-lg glass"
              >
                <RefreshCw className={`w-3 h-3 text-[var(--forex-muted)] ${isRefreshing ? 'animate-spin' : ''}`} />
              </motion.button>
            </LiquidGlass>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2.5">
          <LiquidGlass>
            <button onClick={goToPrevDay} className="btn-3d p-1.5 rounded-lg glass">
              <ChevronLeft className="w-4 h-4 text-[var(--forex-text)]" />
            </button>
          </LiquidGlass>

          <div className="flex-1">
            <LiquidGlass>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="btn-3d w-full glass rounded-lg px-3 py-2 flex items-center justify-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5 text-[var(--forex-accent)]" />
                <span className="text-[12px] font-semibold text-[var(--forex-text)]">
                  {formatDateDisplay(selectedDate)}
                </span>
                <ChevronDown className={`w-3 h-3 text-[var(--forex-muted)] transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
              </button>
            </LiquidGlass>

            {/* Date Picker Dropdown */}
            <AnimatePresence>
              {showDatePicker && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute left-4 right-4 z-50 mt-1 glass-strong rounded-xl p-3 card-depth-2"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold">Jump to Date</span>
                    <button onClick={() => setShowDatePicker(false)} className="p-0.5 rounded hover:bg-white/[0.06]">
                      <X className="w-3 h-3 text-[var(--forex-muted)]" />
                    </button>
                  </div>
                  <input
                    type="date"
                    value={toDateString(selectedDate)}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDate(new Date(e.target.value + 'T12:00:00'));
                        setShowDatePicker(false);
                        setExpandedEvent(null);
                      }
                    }}
                    className="w-full bg-white/[0.06] rounded-lg px-3 py-2 text-[12px] font-medium text-[var(--forex-text)] outline-none focus:ring-1 focus:ring-[var(--forex-accent)]/30 [color-scheme:dark]"
                  />
                  {!isToday && (
                    <button
                      onClick={() => { goToToday(); setShowDatePicker(false); }}
                      className="mt-2 w-full text-[10px] font-semibold text-[var(--forex-accent)] py-1.5 rounded-lg glass-subtle hover:bg-white/[0.08] transition-colors"
                    >
                      Go to Today
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <LiquidGlass>
            <button onClick={goToNextDay} className="btn-3d p-1.5 rounded-lg glass">
              <ChevronRight className="w-4 h-4 text-[var(--forex-text)]" />
            </button>
          </LiquidGlass>
        </div>
      </div>

      {/* ── Summary Bar ── */}
      <div className="px-4 py-2 border-b border-white/[0.06]">
        <div className="glass rounded-xl p-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <div className="mini-stat shrink-0">
            <span className="mini-stat-label">Events</span>
            <span className="mini-stat-value">{summary.total}</span>
          </div>
          <div className="w-px h-6 bg-white/[0.06] shrink-0" />
          <div className="mini-stat shrink-0">
            <span className="mini-stat-label">High Impact</span>
            <span className="mini-stat-value text-red-400">{summary.highImpact}</span>
          </div>
          <div className="w-px h-6 bg-white/[0.06] shrink-0" />
          <div className="mini-stat shrink-0">
            <span className="mini-stat-label">Released</span>
            <span className="mini-stat-value text-[var(--profit)]">{summary.released}</span>
          </div>
          <div className="w-px h-6 bg-white/[0.06] shrink-0" />
          <div className="mini-stat shrink-0">
            <span className="mini-stat-label">Upcoming</span>
            <span className="mini-stat-value text-[var(--gold)]">{summary.upcoming}</span>
          </div>
          <div className="w-px h-6 bg-white/[0.06] shrink-0" />
          <div className="mini-stat shrink-0">
            <span className="mini-stat-label">Sentiment</span>
            <span className={`mini-stat-value flex items-center gap-1 ${
              summary.sentiment === 'bullish' ? 'text-[var(--profit)]' :
              summary.sentiment === 'bearish' ? 'text-[var(--loss)]' :
              'text-[var(--forex-muted)]'
            }`}>
              {summary.sentiment === 'bullish' ? <TrendingUp className="w-3 h-3" /> :
               summary.sentiment === 'bearish' ? <TrendingUp className="w-3 h-3 rotate-180" /> :
               <BarChart3 className="w-3 h-3" />}
              {summary.sentiment.charAt(0).toUpperCase() + summary.sentiment.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Toggle ── */}
      <div className="px-4 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--forex-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full bg-white/[0.04] rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-[var(--forex-text)] placeholder:text-[var(--forex-muted)]/50 outline-none focus:ring-1 focus:ring-[var(--forex-accent)]/30 border border-white/[0.06]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/[0.06]"
              >
                <X className="w-3 h-3 text-[var(--forex-muted)]" />
              </button>
            )}
          </div>
          <LiquidGlass>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-3d p-1.5 rounded-lg relative ${showFilters ? 'glass-strong' : 'glass'}`}
            >
              <Filter className="w-3.5 h-3.5 text-[var(--forex-muted)]" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--forex-accent)] text-[8px] font-bold text-white flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </LiquidGlass>
        </div>

        {/* ── Filter Panel ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-2.5 space-y-2.5">
                {/* Currency Filter */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold">Currency</span>
                    <button onClick={clearAllFilters} className="text-[9px] text-[var(--forex-accent)] font-medium hover:underline">
                      Reset All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {CURRENCIES.map((c) => {
                      const active = selectedCurrencies.has(c);
                      return (
                        <LiquidGlass key={c}>
                          <button
                            onClick={() => toggleCurrency(c)}
                            className={`btn-3d px-2 py-1 rounded-md text-[10px] font-bold tracking-wider transition-all ${
                              active
                                ? 'glass-strong'
                                : 'glass-subtle opacity-50'
                            }`}
                            style={active ? { color: currencyColors[c], borderColor: `${currencyColors[c]}40` } : {}}
                          >
                            {c}
                          </button>
                        </LiquidGlass>
                      );
                    })}
                  </div>
                </div>

                {/* Impact Filter */}
                <div>
                  <span className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold">Impact Level</span>
                  <div className="flex gap-1.5 mt-1.5">
                    {IMPACTS.map((imp) => {
                      const active = selectedImpacts.has(imp);
                      const dotColor = imp === 'High' ? 'bg-red-500' : imp === 'Medium' ? 'bg-orange-400' : 'bg-yellow-400';
                      return (
                        <LiquidGlass key={imp}>
                          <button
                            onClick={() => toggleImpact(imp)}
                            className={`btn-3d flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                              active ? 'glass-strong' : 'glass-subtle opacity-50'
                            }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${dotColor} ${imp === 'High' && active ? 'pulse-dot' : ''}`} />
                            {imp}
                          </button>
                        </LiquidGlass>
                      );
                    })}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <span className="text-[9px] text-[var(--forex-muted)] uppercase tracking-wider font-semibold">Status</span>
                  <div className="flex gap-1.5 mt-1.5">
                    {STATUSES.map((s) => {
                      const active = selectedStatuses.has(s);
                      const isActive = s === 'Released';
                      const isUpcoming = s === 'Upcoming';
                      return (
                        <LiquidGlass key={s}>
                          <button
                            onClick={() => toggleStatus(s)}
                            className={`btn-3d px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                              active
                                ? isActive ? 'status-pill status-pill-active' : isUpcoming ? 'glass-strong text-[var(--gold)]' : 'glass-strong'
                                : 'glass-subtle opacity-50'
                            }`}
                          >
                            {s}
                          </button>
                        </LiquidGlass>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Events Timeline ── */}
      <div className="flex-1 overflow-y-auto forex-scrollbar px-4 py-3">
        {filteredEvents.length === 0 ? (
          /* ── Empty State ── */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4 card-depth-1">
              <Calendar className="w-7 h-7 text-[var(--forex-muted)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--forex-text)] mb-1">No Events Found</h3>
            <p className="text-[11px] text-[var(--forex-muted)] max-w-[240px] leading-relaxed">
              {searchQuery
                ? `No events match "${searchQuery}". Try a different search term.`
                : activeFilterCount > 0
                ? 'No events match the selected filters. Try adjusting your filter criteria.'
                : 'No economic events are scheduled for this date. Try navigating to a different day.'}
            </p>
            {(activeFilterCount > 0 || searchQuery) && (
              <LiquidGlass>
                <button
                  onClick={clearAllFilters}
                  className="btn-3d mt-4 px-4 py-2 rounded-lg glass text-[11px] font-semibold text-[var(--forex-accent)]"
                >
                  Clear Filters
                </button>
              </LiquidGlass>
            )}
          </motion.div>
        ) : (
          /* ── Timeline View ── */
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-[var(--forex-accent)]/30 via-white/[0.08] to-transparent" />

            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event, index) => {
                const isExpanded = expandedEvent === event.id;
                const isStarred = starredEvents.has(event.id);
                const valueDir = getValueDirection(event.actual, event.forecast);

                return (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ delay: index * 0.04 }}
                    className="relative pl-9 pb-3 last:pb-0"
                  >
                    {/* Timeline node */}
                    <div className="absolute left-[13px] top-3.5 z-10">
                      <div
                        className={`w-[14px] h-[14px] rounded-full border-2 flex items-center justify-center ${
                          event.status === 'released'
                            ? 'border-[var(--profit)] bg-[var(--profit)]/20'
                            : event.status === 'upcoming'
                            ? 'border-[var(--gold)] bg-[var(--gold)]/20'
                            : 'border-[var(--forex-muted)]/40 bg-white/[0.04]'
                        }`}
                      >
                        {event.impact === 'high' && (
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            event.status === 'released' ? 'bg-[var(--profit)]' : 'bg-[var(--gold)]'
                          } ${event.status === 'upcoming' ? 'pulse-dot' : ''}`} />
                        )}
                      </div>
                    </div>

                    {/* Event Card */}
                    <div
                      className={`glass rounded-xl overflow-hidden noise-overlay glass-prismatic cursor-pointer transition-all ${
                        event.impact === 'high' && event.status === 'upcoming' ? 'breathe-glow-slow' : ''
                      } ${isExpanded ? 'ring-1 ring-[var(--forex-accent)]/20' : ''}`}
                      onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                    >
                      <div className="p-3">
                        {/* Card Header: Time + Currency + Impact + Star */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1 min-w-[44px]">
                            <Clock className="w-3 h-3 text-[var(--forex-muted)]" />
                            <span className="text-[10px] font-mono font-semibold text-[var(--forex-text)]">
                              {parseTime(event.eventDate)}
                            </span>
                          </div>
                          <CurrencyBadge currency={event.currency} />
                          <ImpactDot impact={event.impact} />
                          <div className="flex-1" />
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            event.status === 'released'
                              ? 'status-pill status-pill-active'
                              : event.status === 'upcoming'
                              ? 'bg-[var(--gold)]/15 text-[var(--gold)]'
                              : 'bg-white/[0.04] text-[var(--forex-muted)]'
                          }`}>
                            {event.status}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); toggleStar(event.id); }}
                            className="p-0.5"
                          >
                            <Star
                              className={`w-3.5 h-3.5 transition-colors ${
                                isStarred ? 'text-[var(--gold)] fill-[var(--gold)]' : 'text-[var(--forex-muted)]/40'
                              }`}
                            />
                          </motion.button>
                        </div>

                        {/* Event Title + Category */}
                        <div className="flex items-start gap-2 mb-2">
                          <h4 className="text-[12px] font-semibold text-[var(--forex-text)] leading-tight flex-1">
                            {event.title}
                          </h4>
                          <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${getCategoryStyle(event.category)}`}>
                            {event.category}
                          </span>
                        </div>

                        {/* Values Row: Actual / Forecast / Previous */}
                        <div className="grid grid-cols-3 gap-1.5">
                          <div className="glass-subtle rounded-lg p-1.5 text-center">
                            <div className="text-[8px] text-[var(--forex-muted)] mb-0.5 uppercase tracking-wider font-semibold">Actual</div>
                            <div className={`text-[11px] font-mono font-bold tabular-nums flex items-center justify-center gap-0.5 ${
                              event.actual
                                ? getValueColor(event.actual, event.forecast)
                                : 'text-[var(--forex-muted)]'
                            }`}>
                              {event.actual ? (
                                <>
                                  {valueDir === 'up' && <ArrowUp className="w-2.5 h-2.5" />}
                                  {valueDir === 'down' && <ArrowDown className="w-2.5 h-2.5" />}
                                  {event.actual}
                                </>
                              ) : (
                                '—'
                              )}
                            </div>
                          </div>
                          <div className="glass-subtle rounded-lg p-1.5 text-center">
                            <div className="text-[8px] text-[var(--forex-muted)] mb-0.5 uppercase tracking-wider font-semibold">Forecast</div>
                            <div className="text-[11px] font-mono font-bold tabular-nums text-[var(--forex-text)]">
                              {event.forecast || '—'}
                            </div>
                          </div>
                          <div className="glass-subtle rounded-lg p-1.5 text-center">
                            <div className="text-[8px] text-[var(--forex-muted)] mb-0.5 uppercase tracking-wider font-semibold">Previous</div>
                            <div className="text-[11px] font-mono font-bold tabular-nums text-[var(--forex-muted)]">
                              {event.previous || '—'}
                            </div>
                          </div>
                        </div>

                        {/* Expand/Collapse indicator */}
                        <div className="flex items-center justify-center mt-2">
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-3 h-3 text-[var(--forex-muted)]/50" />
                          </motion.div>
                        </div>

                        {/* Expanded Detail Section */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="glow-divider my-2" />
                              {event.description && (
                                <p className="text-[11px] leading-relaxed text-[var(--forex-text)]/70 mb-2.5">
                                  {event.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-[var(--forex-muted)]" />
                                  <span className="text-[9px] text-[var(--forex-muted)] font-medium">{event.source}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-[var(--forex-muted)]" />
                                  <span className="text-[9px] text-[var(--forex-muted)] font-medium capitalize">{event.impact} Impact</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}