'use client';

import { useState, useMemo, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenLine,
  Star,
  Search,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  Tag,
  Brain,
  BarChart3,
  Flame,
  TrendingUp,
  BookOpen,
  Sparkles,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TradeJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface JournalEntry {
  id: string;
  date: string;
  pair: string;
  entryType: 'Manual' | 'Signal' | 'Algorithmic';
  emotionalState: 'Calm' | 'Confident' | 'Anxious' | 'FOMO' | 'Revenge';
  marketCondition: 'Trending' | 'Ranging' | 'Volatile' | 'Choppy';
  preAnalysis: string;
  postNotes: string;
  rating: number;
  lessonsLearned: string;
  tags: string[];
  createdAt: string;
}

const PAIRS = [
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'USD/CHF',
  'AUD/USD',
  'USD/CAD',
  'NZD/USD',
  'EUR/GBP',
  'GBP/JPY',
  'EUR/JPY',
];

const ENTRY_TYPES: JournalEntry['entryType'][] = ['Manual', 'Signal', 'Algorithmic'];
const EMOTIONS: JournalEntry['emotionalState'][] = ['Calm', 'Confident', 'Anxious', 'FOMO', 'Revenge'];
const CONDITIONS: JournalEntry['marketCondition'][] = ['Trending', 'Ranging', 'Volatile', 'Choppy'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatEntryDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function uid(): string {
  return 'j_' + Math.random().toString(36).slice(2, 10);
}

const EMOTION_COLORS: Record<JournalEntry['emotionalState'], string> = {
  Calm: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  Confident: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
  Anxious: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  FOMO: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
  Revenge: 'bg-red-500/15 border-red-500/30 text-red-400',
};

const CONDITION_COLORS: Record<JournalEntry['marketCondition'], string> = {
  Trending: 'bg-violet-500/15 border-violet-500/30 text-violet-400',
  Ranging: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
  Volatile: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
  Choppy: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
};

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

function createSampleEntries(): JournalEntry[] {
  const now = Date.now();
  return [
    {
      id: uid(), date: todayStr(), pair: 'EUR/USD', entryType: 'Signal', emotionalState: 'Confident',
      marketCondition: 'Trending', preAnalysis: 'Strong bullish momentum on H4. RSI at 62, MACD crossing bullish. ECB rate decision pending — waiting for breakout above 1.0870.',
      postNotes: 'Trade worked perfectly. Entry at 1.0862, exited at 1.0890 for +28 pips. Good discipline holding through minor pullback.',
      rating: 5, lessonsLearned: 'Trust the signal confluence. Wait for MACD confirmation before entering.', tags: ['breakout', 'H4', 'ECB'], createdAt: new Date(now - 86400000).toISOString(),
    },
    {
      id: uid(), date: todayStr(), pair: 'GBP/USD', entryType: 'Manual', emotionalState: 'Calm',
      marketCondition: 'Ranging', preAnalysis: 'Range between 1.2700-1.2760. Looking for mean reversion short near top of range with RSI overbought at 72.',
      postNotes: 'Entry at 1.2752, stop at 1.2765. Exited at 1.2720 for +32 pips. Clean range trade.',
      rating: 4, lessonsLearned: 'Range trading works well in low-volatility sessions. Avoid during news.', tags: ['range', 'mean-reversion', 'GBP'], createdAt: new Date(now - 172800000).toISOString(),
    },
    {
      id: uid(), date: new Date(now - 259200000).toISOString().slice(0, 10), pair: 'USD/JPY', entryType: 'Algorithmic', emotionalState: 'Calm',
      marketCondition: 'Trending', preAnalysis: 'Algo triggered on D1 trend continuation pattern. BoJ policy divergence driving sustained USD strength.',
      postNotes: 'Algo managed the trade end-to-end. Entry 156.80, exit 157.35 for +55 pips. Zero emotional interference.',
      rating: 5, lessonsLearned: 'Algo performs best in clear trending markets. Need better chop detection filter.', tags: ['algo', 'D1', 'BoJ', 'trend'], createdAt: new Date(now - 259200000).toISOString(),
    },
    {
      id: uid(), date: new Date(now - 345600000).toISOString().slice(0, 10), pair: 'AUD/USD', entryType: 'Signal', emotionalState: 'FOMO',
      marketCondition: 'Choppy', preAnalysis: 'Saw a signal for long AUD/USD. Market was choppy but I jumped in anyway fearing I would miss the move.',
      postNotes: 'Stopped out for -20 pips. Classic FOMO entry. Price reversed immediately after my entry.',
      rating: 1, lessonsLearned: 'NEVER enter during choppy conditions regardless of signal strength. FOMO is the biggest account killer.', tags: ['FOMO', 'mistake', 'choppy'], createdAt: new Date(now - 345600000).toISOString(),
    },
    {
      id: uid(), date: new Date(now - 432000000).toISOString().slice(0, 10), pair: 'USD/CAD', entryType: 'Manual', emotionalState: 'Anxious',
      marketCondition: 'Volatile', preAnalysis: 'Oil inventory data coming. USD/CAD near support at 1.3620. Expecting bounce if data is bearish for CAD.',
      postNotes: 'Initial move went against me -40 pips. Almost closed manually but held. Price reversed and hit TP for +35 pips.',
      rating: 3, lessonsLearned: 'Trust your levels during news. Anxiety caused near-premature exit. Need better risk sizing for news trades.', tags: ['news', 'oil', 'anxiety', 'patience'], createdAt: new Date(now - 432000000).toISOString(),
    },
    {
      id: uid(), date: new Date(now - 518400000).toISOString().slice(0, 10), pair: 'EUR/GBP', entryType: 'Signal', emotionalState: 'Confident',
      marketCondition: 'Trending', preAnalysis: 'Triple bottom formation on H4 with rising volume. UK economic data weakening. Confluence of technical and fundamental.',
      postNotes: 'Excellent trade. +30 pips with 1:3 risk-reward. Entry at 0.8510, TP at 0.8540, SL at 0.8490.',
      rating: 4, lessonsLearned: 'Triple bottoms are highly reliable in forex. Combine with fundamental backdrop for best results.', tags: ['triple-bottom', 'confluence', 'cross-pair'], createdAt: new Date(now - 518400000).toISOString(),
    },
    {
      id: uid(), date: new Date(now - 604800000).toISOString().slice(0, 10), pair: 'NZD/USD', entryType: 'Manual', emotionalState: 'Revenge',
      marketCondition: 'Volatile', preAnalysis: 'Just lost on AUD/USD and immediately entered NZD/USD short to "make it back". No real analysis done.',
      postNotes: 'Revenge trade backfired. Stopped out for -25 pips. Turned a bad day into a terrible one.',
      rating: 1, lessonsLearned: 'ALWAYS take a break after a loss. Revenge trading is emotional destruction. Set a daily loss limit.', tags: ['revenge', 'mistake', 'discipline'], createdAt: new Date(now - 604800000).toISOString(),
    },
    {
      id: uid(), date: new Date(now - 691200000).toISOString().slice(0, 10), pair: 'EUR/USD', entryType: 'Algorithmic', emotionalState: 'Calm',
      marketCondition: 'Trending', preAnalysis: 'D1 breakout system triggered. Large position size due to strong multi-timeframe alignment (D1+H4+H1 all bullish).',
      postNotes: 'Best trade of the week. Algo scaled in perfectly. Total +50 pips across 3 partial exits.',
      rating: 5, lessonsLearned: 'Multi-timeframe confluence with algorithmic execution is the edge. Scale out to maximize.', tags: ['algo', 'breakout', 'multi-TF', 'best-trade'], createdAt: new Date(now - 691200000).toISOString(),
    },
  ];
}

// ---------------------------------------------------------------------------
// Star Rating component
// ---------------------------------------------------------------------------

function StarRating({
  value,
  onChange,
  readonly = false,
  size = 18,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => !readonly && setHover(i)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-all ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star
            size={size}
            className={
              (hover || value) >= i
                ? 'fill-[var(--gold)] text-[var(--gold)]'
                : 'fill-transparent text-white/20'
            }
          />
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pill button group
// ---------------------------------------------------------------------------

function PillGroup<T extends string>({
  options,
  selected,
  onSelect,
  colorMap,
  label,
  disabled = false,
}: {
  options: T[];
  selected: T;
  onSelect: (v: T) => void;
  colorMap: Record<T, string>;
  label?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div>
      {label && (
        <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              selected === opt
                ? colorMap[opt]
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Journal Entry Card
// ---------------------------------------------------------------------------

function EntryCard({
  entry,
  expanded,
  onToggle,
  onDelete,
}: {
  entry: JournalEntry;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      className="glass-subtle rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-colors group"
    >
      {/* Collapsed header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-start gap-3"
      >
        {/* Pair & date */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-[var(--forex-text)]">
              {entry.pair}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${EMOTION_COLORS[entry.emotionalState]}`}>
              {entry.emotionalState}
            </span>
            <span className="text-[10px] text-white/30 ml-auto shrink-0">
              {formatEntryDate(entry.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <StarRating value={entry.rating} readonly size={13} />
            <span className="text-[10px] text-white/30">{entry.entryType}</span>
          </div>
          <p className="text-xs text-white/40 mt-1.5 line-clamp-1">
            {entry.preAnalysis}
          </p>
        </div>

        <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={14} className="text-white/30" />
          </motion.div>
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-0 border-t border-white/[0.05]">
              <div className="pt-3 space-y-3">
                {/* Market Condition */}
                <div className="flex items-center gap-2">
                  <BarChart3 size={12} className="text-white/30 shrink-0" />
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${CONDITION_COLORS[entry.marketCondition]}`}>
                    {entry.marketCondition}
                  </span>
                </div>

                {/* Pre-trade Analysis */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">
                    Pre-Trade Analysis
                  </p>
                  <p className="text-xs text-white/60 leading-relaxed">{entry.preAnalysis}</p>
                </div>

                {/* Post-trade Notes */}
                {entry.postNotes && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">
                      Post-Trade Notes
                    </p>
                    <p className="text-xs text-white/60 leading-relaxed">{entry.postNotes}</p>
                  </div>
                )}

                {/* Lessons Learned */}
                {entry.lessonsLearned && (
                  <div className="glass rounded-lg p-2.5 border border-[var(--forex-accent)]/20">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--forex-accent)]/70 mb-1 flex items-center gap-1">
                      <Sparkles size={10} /> Lessons Learned
                    </p>
                    <p className="text-xs text-white/70 leading-relaxed">{entry.lessonsLearned}</p>
                  </div>
                )}

                {/* Tags */}
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-white/40"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Delete button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={onDelete}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                  >
                    <Trash2 size={11} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Statistics Bar
// ---------------------------------------------------------------------------

function StatsBar({ entries }: { entries: JournalEntry[] }) {
  const totalEntries = entries.length;
  const avgRating = totalEntries > 0
    ? entries.reduce((s, e) => s + e.rating, 0) / totalEntries
    : 0;

  // Count emotions
  const emotionCounts: Record<string, number> = {};
  entries.forEach((e) => {
    emotionCounts[e.emotionalState] = (emotionCounts[e.emotionalState] || 0) + 1;
  });
  const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];
  const totalEmotionVotes = totalEntries;

  // Win-like entries (rating >= 4)
  const highQuality = entries.filter((e) => e.rating >= 4).length;
  const qualityPercent = totalEntries > 0 ? Math.round((highQuality / totalEntries) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
      {/* Total entries */}
      <div className="mini-stat glass-subtle rounded-lg border border-white/[0.06] px-3 py-2.5 text-center">
        <p className="text-lg font-bold text-[var(--forex-text)]">{totalEntries}</p>
        <p className="text-[10px] text-white/40 uppercase tracking-wider">Entries</p>
      </div>

      {/* Avg rating */}
      <div className="mini-stat glass-subtle rounded-lg border border-white/[0.06] px-3 py-2.5 text-center">
        <div className="flex items-center justify-center gap-1">
          <Star size={12} className="fill-[var(--gold)] text-[var(--gold)]" />
          <p className="text-lg font-bold text-[var(--gold)]">{avgRating.toFixed(1)}</p>
        </div>
        <p className="text-[10px] text-white/40 uppercase tracking-wider">Avg Rating</p>
      </div>

      {/* Top emotion */}
      <div className="mini-stat glass-subtle rounded-lg border border-white/[0.06] px-3 py-2.5 text-center">
        {topEmotion ? (
          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${EMOTION_COLORS[topEmotion[0] as JournalEntry['emotionalState']]}`}>
            {topEmotion[0]} ({topEmotion[1]})
          </span>
        ) : (
          <p className="text-xs text-white/30">—</p>
        )}
        <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Top Emotion</p>
      </div>

      {/* Quality rate */}
      <div className="mini-stat glass-subtle rounded-lg border border-white/[0.06] px-3 py-2.5 text-center">
        <p className={`text-lg font-bold ${qualityPercent >= 60 ? 'text-[var(--profit)]' : qualityPercent >= 40 ? 'text-[var(--gold)]' : 'text-[var(--loss)]'}`}>
          {qualityPercent}%
        </p>
        <p className="text-[10px] text-white/40 uppercase tracking-wider">Quality (4+★)</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Textarea with counter
// ---------------------------------------------------------------------------

function CountedTextarea({
  value,
  onChange,
  max,
  placeholder,
  label,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  max: number;
  placeholder: string;
  label: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => {
          if (e.target.value.length <= max) onChange(e.target.value);
        }}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[var(--forex-accent)]/50 transition-colors resize-none"
      />
      <p className={`text-[10px] mt-1 text-right ${value.length > max * 0.9 ? 'text-amber-400/60' : 'text-white/20'}`}>
        {value.length}/{max}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Modal
// ---------------------------------------------------------------------------

export function TradeJournalModal({ isOpen, onClose }: TradeJournalModalProps) {
  const [entries, setEntries] = useState<JournalEntry[]>(() => createSampleEntries());
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formDate, setFormDate] = useState(todayStr());
  const [formPair, setFormPair] = useState(PAIRS[0]);
  const [formEntryType, setFormEntryType] = useState<JournalEntry['entryType']>('Manual');
  const [formEmotion, setFormEmotion] = useState<JournalEntry['emotionalState']>('Calm');
  const [formCondition, setFormCondition] = useState<JournalEntry['marketCondition']>('Trending');
  const [formPreAnalysis, setFormPreAnalysis] = useState('');
  const [formPostNotes, setFormPostNotes] = useState('');
  const [formRating, setFormRating] = useState(3);
  const [formLessons, setFormLessons] = useState('');
  const [formTags, setFormTags] = useState('');

  // Filtered entries
  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.pair.toLowerCase().includes(q) ||
        e.emotionalState.toLowerCase().includes(q) ||
        e.preAnalysis.toLowerCase().includes(q) ||
        e.postNotes.toLowerCase().includes(q) ||
        e.lessonsLearned.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [entries, search]);

  const resetForm = useCallback(() => {
    setFormDate(todayStr());
    setFormPair(PAIRS[0]);
    setFormEntryType('Manual');
    setFormEmotion('Calm');
    setFormCondition('Trending');
    setFormPreAnalysis('');
    setFormPostNotes('');
    setFormRating(3);
    setFormLessons('');
    setFormTags('');
    setShowForm(false);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const newEntry: JournalEntry = {
        id: uid(),
        date: formDate,
        pair: formPair,
        entryType: formEntryType,
        emotionalState: formEmotion,
        marketCondition: formCondition,
        preAnalysis: formPreAnalysis,
        postNotes: formPostNotes,
        rating: formRating,
        lessonsLearned: formLessons,
        tags: formTags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        createdAt: new Date().toISOString(),
      };
      setEntries((prev) => [newEntry, ...prev]);
      resetForm();
    },
    [formDate, formPair, formEntryType, formEmotion, formCondition, formPreAnalysis, formPostNotes, formRating, formLessons, formTags, resetForm]
  );

  const handleDelete = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setExpandedId((prev) => (prev === id ? null : prev));
  }, []);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="journal-overlay"
          className="alert-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="alert-modal-sheet glass glass-deep corner-br-tr corner-br-bl"
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 640,
              width: '94vw',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Corner brackets decoration */}
            <span className="absolute top-2 left-2 w-4 h-4 border-t border-l border-white/20 rounded-tl-sm pointer-events-none" />
            <span className="absolute top-2 right-2 w-4 h-4 border-t border-r border-white/20 rounded-tr-sm pointer-events-none" />
            <span className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-white/20 rounded-bl-sm pointer-events-none" />
            <span className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-white/20 rounded-br-sm pointer-events-none" />

            <div className="relative z-10 flex flex-col overflow-hidden" style={{ height: '100%' }}>
              {/* ── Header ── */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--forex-accent)]/15 border border-[var(--forex-accent)]/25 flex items-center justify-center">
                    <PenLine size={15} className="text-[var(--forex-accent)]" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[var(--forex-text)]">
                      Trade Journal
                    </h2>
                    <p className="text-[10px] text-white/40">
                      {entries.length} entries logged
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm((p) => !p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      showForm
                        ? 'btn-3d bg-[var(--forex-accent)]/15 border-[var(--forex-accent)]/30 text-[var(--forex-accent)]'
                        : 'glass-prismatic text-white/70 hover:text-white'
                    }`}
                  >
                    <BookOpen size={12} />
                    <span className="hidden sm:inline">{showForm ? 'Close Form' : 'New Entry'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* ── Scrollable Body ── */}
              <div className="flex-1 overflow-y-auto forex-scrollbar px-5 pb-5 space-y-4">
                {/* Statistics */}
                <StatsBar entries={entries} />

                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search journal entries..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[var(--forex-accent)]/50 transition-colors"
                  />
                </div>

                {/* ── New Entry Form ── */}
                <AnimatePresence>
                  {showForm && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <form
                        onSubmit={handleSubmit}
                        className="glass rounded-xl border border-white/[0.08] p-4 space-y-3"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles size={13} className="text-[var(--forex-accent)]" />
                          <p className="text-xs font-semibold text-[var(--forex-accent)] uppercase tracking-wider">
                            New Journal Entry
                          </p>
                        </div>

                        {/* Date & Pair row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                              <Calendar size={10} className="inline mr-1" />
                              Date
                            </label>
                            <input
                              type="date"
                              value={formDate}
                              onChange={(e) => setFormDate(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--forex-accent)]/50 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                              Pair / Trade ID
                            </label>
                            <select
                              value={formPair}
                              onChange={(e) => setFormPair(e.target.value)}
                              className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--forex-accent)]/50 transition-colors"
                            >
                              {PAIRS.map((p) => (
                                <option key={p} value={p} className="bg-gray-900 text-white">
                                  {p}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Entry Type */}
                        <div>
                          <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                            Entry Type
                          </label>
                          <div className="flex gap-2">
                            {ENTRY_TYPES.map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setFormEntryType(t)}
                                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all border ${
                                  formEntryType === t
                                    ? 'bg-[var(--forex-accent)]/15 border-[var(--forex-accent)]/30 text-[var(--forex-accent)]'
                                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Emotional State */}
                        <PillGroup
                          label={<><Brain size={10} className="inline mr-1" />Emotional State</>}
                          options={EMOTIONS}
                          selected={formEmotion}
                          onSelect={setFormEmotion}
                          colorMap={EMOTION_COLORS}
                        />

                        {/* Market Condition */}
                        <PillGroup
                          label={<><BarChart3 size={10} className="inline mr-1" />Market Condition</>}
                          options={CONDITIONS}
                          selected={formCondition}
                          onSelect={setFormCondition}
                          colorMap={CONDITION_COLORS}
                        />

                        {/* Pre-trade Analysis */}
                        <CountedTextarea
                          value={formPreAnalysis}
                          onChange={setFormPreAnalysis}
                          max={500}
                          placeholder="What was your analysis before entering the trade?"
                          label="Pre-Trade Analysis"
                        />

                        {/* Post-trade Notes */}
                        <CountedTextarea
                          value={formPostNotes}
                          onChange={setFormPostNotes}
                          max={500}
                          placeholder="How did the trade play out? What happened?"
                          label="Post-Trade Notes"
                          rows={2}
                        />

                        {/* Rating */}
                        <div>
                          <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                            Trade Quality Rating
                          </label>
                          <StarRating value={formRating} onChange={setFormRating} />
                        </div>

                        {/* Lessons Learned */}
                        <CountedTextarea
                          value={formLessons}
                          onChange={setFormLessons}
                          max={300}
                          placeholder="What did you learn from this trade?"
                          label="Lessons Learned"
                          rows={2}
                        />

                        {/* Tags */}
                        <div>
                          <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                            <Tag size={10} className="inline mr-1" />
                            Tags
                            <span className="text-white/30 normal-case ml-1">(comma-separated)</span>
                          </label>
                          <input
                            type="text"
                            value={formTags}
                            onChange={(e) => setFormTags(e.target.value)}
                            placeholder="e.g. breakout, H4, discipline"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[var(--forex-accent)]/50 transition-colors"
                          />
                        </div>

                        {/* Submit buttons */}
                        <div className="flex gap-3 pt-1">
                          <button
                            type="button"
                            onClick={resetForm}
                            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold btn-3d bg-gradient-to-r from-[var(--forex-accent)] to-[var(--forex-accent)]/80 text-black hover:opacity-90 transition-all"
                          >
                            Save Entry
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Entry List ── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-white/40 uppercase tracking-wider">
                      Journal Entries
                    </p>
                    <p className="text-[10px] text-white/25">
                      {filteredEntries.length} of {entries.length}
                    </p>
                  </div>

                  {filteredEntries.length === 0 ? (
                    <div className="glass-subtle rounded-xl border border-white/[0.06] p-8 text-center">
                      <BookOpen size={24} className="mx-auto text-white/15 mb-2" />
                      <p className="text-sm text-white/30">No journal entries found</p>
                      <p className="text-xs text-white/20 mt-1">
                        {search ? 'Try a different search term' : 'Click "New Entry" to start logging your trades'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <AnimatePresence mode="popLayout">
                        {filteredEntries.map((entry) => (
                          <motion.div
                            key={entry.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <EntryCard
                              entry={entry}
                              expanded={expandedId === entry.id}
                              onToggle={() =>
                                setExpandedId((prev) => (prev === entry.id ? null : entry.id))
                              }
                              onDelete={() => handleDelete(entry.id)}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTradeJournal() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, open, close };
}


