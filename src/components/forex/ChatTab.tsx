'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Hash, ChevronDown, Users, Search, X, Copy, Trash2, Pencil } from 'lucide-react';
import { useForexStore } from '@/lib/store';
import type { ChatMessage } from '@/types/forex';
import LiquidGlass from './LiquidGlass';

const reactionEmojis = ['👍', '🎯', '📊', '🔥'] as const;

const presenceUsers = [
  { id: 'analyst-1', username: 'MarketAnalyst', role: 'lead_analyst' },
  { id: 'trader-2', username: 'FXHunter', role: 'senior_trader' },
  { id: 'trader-3', username: 'PipMaster', role: 'trader' },
  { id: 'trader-4', username: 'CurrencyKing', role: 'senior_trader' },
  { id: 'sys-1', username: 'System', role: 'system' },
];

const typingUsernames = ['MarketAnalyst', 'FXHunter', 'PipMaster', 'CurrencyKing'];

const channels = [
  { id: 'general', name: 'General', count: 24 },
  { id: 'signals', name: 'Signal Analysis', count: 12 },
  { id: 'beginners', name: 'Beginners', count: 8 },
  { id: 'advanced', name: 'Advanced Strategy', count: 5 },
];

const initialMessages: ChatMessage[] = [
  {
    id: '1', userId: 'analyst-1', username: 'MarketAnalyst', avatar: null, role: 'lead_analyst',
    content: 'EUR/USD is approaching key resistance at 1.0875. Watch for a break above this level with volume confirmation.',
    channelId: 'general', createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2', userId: 'trader-2', username: 'FXHunter', avatar: null, role: 'senior_trader',
    content: 'Agreed. The 4H chart shows a clear ascending triangle. If we get a break, target 1.0920.',
    channelId: 'general', createdAt: new Date(Date.now() - 2400000).toISOString(),
  },
  {
    id: '3', userId: 'trader-3', username: 'PipMaster', avatar: null, role: 'trader',
    content: 'NFP data coming Friday. Might want to reduce position sizes ahead of the release.',
    channelId: 'general', createdAt: new Date(Date.now() - 1200000).toISOString(),
  },
  {
    id: '4', userId: 'analyst-1', username: 'MarketAnalyst', avatar: null, role: 'lead_analyst',
    content: 'GBP/USD forming a bearish divergence on RSI. Short-term bias is bearish below 1.2750.',
    channelId: 'signals', createdAt: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: '5', userId: 'trader-4', username: 'CurrencyKing', avatar: null, role: 'senior_trader',
    content: 'USD/JPY holding above 157.00 support. BOJ policy meeting next week could provide the catalyst for a breakout.',
    channelId: 'general', createdAt: new Date(Date.now() - 300000).toISOString(),
  },
];

function getRoleBadge(role: string) {
  switch (role) {
    case 'lead_analyst':
      return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--gold)]/15 text-[var(--gold)]">LEAD ANALYST</span>;
    case 'senior_trader':
      return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--profit)]/15 text-[var(--profit)]">SENIOR</span>;
    default:
      return null;
  }
}

function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function useOnlineCount() {
  const [count, setCount] = useState(28);
  useEffect(() => {
    const id = setInterval(() => {
      setCount((prev) => Math.max(15, Math.min(45, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 8000);
    return () => clearInterval(id);
  }, []);
  return count;
}

export default function ChatTab() {
  const { currentUser, chatMessages: socketMessages, socketConnected, sendChatMessage } = useForexStore();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [activeChannel, setActiveChannel] = useState('general');
  const [showChannels, setShowChannels] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [reactions, setReactions] = useState<Map<string, Map<string, number>>>(new Map());
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [otherTypingUser, setOtherTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const onlineCount = useOnlineCount();

  // Merge socket messages with local ones
  const allMessages = useCallback(() => {
    const merged = [...messages];
    for (const sm of socketMessages) {
      if (!merged.find(m => m.id === sm.id)) {
        merged.push(sm as ChatMessage);
      }
    }
    return merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, socketMessages]);

  const filteredMessages = allMessages().filter((m) => m.channelId === activeChannel);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages.length]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.avatar,
      role: currentUser.role,
      content: inputValue.trim().slice(0, 500),
      channelId: activeChannel,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');
    setIsTyping(false);
    inputRef.current?.focus();

    // Send to socket.io
    sendChatMessage({
      userId: currentUser.id,
      username: currentUser.username,
      role: currentUser.role,
      content: newMessage.content,
      channelId: activeChannel,
    });
  }, [inputValue, activeChannel, currentUser, sendChatMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    setIsTyping(true);
  };

  const isOwn = (msg: ChatMessage) => msg.userId === currentUser.id;

  // Reaction toggle
  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    setReactions((prev) => {
      const next = new Map(prev);
      const msgReactions = new Map(next.get(messageId));
      const current = msgReactions.get(emoji) ?? 0;
      if (current === 0) {
        msgReactions.set(emoji, 1);
      } else {
        msgReactions.delete(emoji);
        if (msgReactions.size === 0) {
          next.delete(messageId);
          return next;
        }
      }
      next.set(messageId, msgReactions);
      return next;
    });
  }, []);

  // Copy message content
  const handleCopyMessage = useCallback(async (content: string) => {
    await navigator.clipboard.writeText(content);
  }, []);

  // Delete message
  const handleDeleteMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  // Simulated other user typing
  useEffect(() => {
    const scheduleNext = () => {
      const delay = 15000 + Math.random() * 15000;
      return setTimeout(() => {
        const user = typingUsernames[Math.floor(Math.random() * typingUsernames.length)];
        setOtherTypingUser(user);
        const dismissDelay = 2000 + Math.random() * 2000;
        const dismissTimer = setTimeout(() => {
          setOtherTypingUser(null);
        }, dismissDelay);
        scheduleNext();
        return () => clearTimeout(dismissTimer);
      }, delay);
    };
    const timer = scheduleNext();
    return () => clearTimeout(timer);
  }, []);

  // Group messages by time gaps
  const baseGrouped = useMemo(() => {
    const result: { type: 'time-gap'; time: string } | { type: 'message'; msg: ChatMessage }[] = [];
    for (let i = 0; i < filteredMessages.length; i++) {
      const msg = filteredMessages[i];
      if (i === 0 || msg.createdAt !== filteredMessages[i - 1].createdAt) {
        result.push({ type: 'time-gap', time: formatTime(msg.createdAt) });
      }
      result.push({ type: 'message', msg });
    }
    return result;
  }, [filteredMessages]);

  // Search filter
  const groupedMessages = useMemo(() => {
    if (!searchQuery.trim()) return baseGrouped;
    const q = searchQuery.toLowerCase();
    const filtered = baseGrouped.filter(item => {
      if (item.type === 'time-gap') return false;
      const msg = item.msg;
      return msg.content.toLowerCase().includes(q) || msg.username.toLowerCase().includes(q);
    });
    // Re-add time gaps between filtered messages
    const result: typeof baseGrouped = [];
    for (const item of filtered) {
      if (item.type === 'message' && (result.length === 0 || result[result.length - 1]?.type !== 'time-gap')) {
        result.push({ type: 'time-gap', time: formatTime(item.msg.createdAt) });
      }
      result.push(item);
    }
    return result;
  }, [baseGrouped, searchQuery]);

  const matchCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    return groupedMessages.filter(item => item.type === 'message').length;
  }, [groupedMessages, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Channel Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <LiquidGlass>
          <button
            onClick={() => setShowChannels(!showChannels)}
            className="btn-3d flex items-center gap-2 px-3 py-2 rounded-lg glass"
          >
            <Hash className="w-4 h-4 text-[var(--forex-accent)]" />
            <span className="text-sm font-semibold">{channels.find(c => c.id === activeChannel)?.name}</span>
            <ChevronDown className={`w-3 h-3 text-[var(--forex-muted)] transition-transform ${showChannels ? 'rotate-180' : ''}`} />
          </button>
        </LiquidGlass>

        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 glass-subtle rounded-lg px-2 py-1">
              <Users className="w-3 h-3 text-[var(--forex-muted)]" />
              <span className="text-[10px] font-mono font-semibold text-[var(--forex-muted)]">{onlineCount}</span>
            </div>
            <button
              onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); }}
              className="p-1.5 rounded-lg glass-subtle hover:bg-white/[0.06] transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-[var(--forex-muted)]" />
            </button>
            {socketConnected && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--profit)] animate-pulse" />
                <span className="text-[8px] text-[var(--profit)] font-medium uppercase">Live</span>
              </div>
            )}
          </div>
      </div>

      {/* User Presence Bar */}
      <div className="px-4 py-1.5 border-b border-white/[0.04] overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1.5">
          {presenceUsers.slice(0, 5).map((u) => {
            const roleColor = u.role === 'lead_analyst'
              ? 'bg-[var(--gold)] text-black'
              : u.role === 'senior_trader'
                ? 'bg-[var(--profit)] text-black'
                : u.role === 'system'
                  ? 'bg-[var(--forex-accent)] text-black'
                  : 'bg-white/6 text-[var(--forex-muted)]';
            return (
              <div
                key={u.id}
                className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${roleColor}`}
                title={u.username}
              >
                {u.username.charAt(0).toUpperCase()}
              </div>
            );
          })}
          <span className="text-[9px] text-[var(--forex-muted)]/60 px-1.5 py-0.5 rounded-full bg-white/[0.03] flex-shrink-0">
            +{Math.max(0, onlineCount - 5)} more
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="search-bar-glass rounded-lg px-3 py-2 mx-4 mt-2">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[var(--forex-muted)] flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages..."
                  className="flex-1 bg-transparent text-sm text-[var(--forex-text)] placeholder:text-[var(--forex-muted)]/50 focus:outline-none"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-0.5 rounded hover:bg-white/[0.06] transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-[var(--forex-muted)]" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Channel Drawer */}
      <AnimatePresence>
        {showChannels && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/[0.06]"
          >
            <div className="p-2 space-y-0.5">
              {channels.map((ch) => (
                <LiquidGlass key={ch.id}>
                  <button
                    onClick={() => { setActiveChannel(ch.id); setShowChannels(false); }}
                    className={`btn-3d w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                      ch.id === activeChannel ? 'glass-strong text-[var(--forex-accent)]' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5" />
                      <span className="text-sm font-medium">{ch.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {ch.id === activeChannel && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--forex-accent)] pulse-dot" />
                      )}
                      <span className="text-[10px] text-[var(--forex-muted)]">{ch.count}</span>
                    </div>
                  </button>
                </LiquidGlass>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto forex-scrollbar px-4 py-3">
        {searchQuery.trim() && (
          <div className="text-[10px] font-mono text-[var(--forex-accent)] mb-2 text-center">
            {matchCount} message{matchCount !== 1 ? 's' : ''} found
          </div>
        )}
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {groupedMessages.map((item, idx) => {
              if (item.type === 'time-gap') {
                return (
                  <div key={`gap-${idx}`} className="flex items-center justify-center py-1">
                    <span className="text-[9px] font-mono text-[var(--forex-muted)]/60 bg-white/[0.02] px-2 py-0.5 rounded-full">{item.time}</span>
                  </div>
                );
              }

              const msg = item.msg;
              const own = isOwn(msg);
              const showAvatar = idx === 0 || groupedMessages[idx - 1]?.type === 'time-gap' || (groupedMessages[idx - 1]?.type === 'message' && !isOwn(groupedMessages[idx - 1].msg));
              const msgReactions = reactions.get(msg.id);
              const hasReactions = msgReactions && msgReactions.size > 0;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`group flex gap-2.5 ${own ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                    own
                      ? 'bg-[var(--forex-accent)]/15 text-[var(--forex-accent)]'
                      : 'bg-white/[0.06] text-[var(--forex-muted)]'
                  }`}>
                    {msg.username.charAt(0).toUpperCase()}
                  </div>

                  <div className={`max-w-[78%] ${own ? 'items-end' : 'items-start'} ${showAvatar ? '' : 'mt-5'}`}>
                    {showAvatar && (
                      <div className={`flex items-center gap-1.5 mb-1 ${own ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[11px] font-semibold">{msg.username}</span>
                        {getRoleBadge(msg.role)}
                      </div>
                    )}
                    <div className="relative">
                      <div className={`${own ? 'chat-bubble-out' : 'chat-bubble-in'} glass-prismatic px-3 py-2`}>
                        <p className="text-[13px] leading-relaxed">{msg.content}</p>
                      </div>

                      {/* Reaction bar - non-own messages, hover reveal */}
                      {!own && (
                        <motion.div
                          initial={false}
                          animate={{ opacity: 1, y: 0 }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 mt-1"
                        >
                          {reactionEmojis.map((emoji) => (
                            <motion.button
                              key={emoji}
                              whileTap={{ scale: 0.7 }}
                              whileHover={{ scale: 1.15 }}
                              onClick={() => toggleReaction(msg.id, emoji)}
                              className="text-[11px] px-1 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                            >
                              {emoji}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}

                      {/* Action bar - own messages, hover reveal */}
                      {own && (
                        <motion.div
                          initial={false}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 mt-1 justify-end"
                        >
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            whileHover={{ scale: 1.1 }}
                            onClick={() => setEditingMessageId(msg.id)}
                            className="p-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[var(--forex-muted)] hover:text-[var(--forex-text)] transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            whileHover={{ scale: 1.1 }}
                            onClick={() => handleCopyMessage(msg.content)}
                            className="p-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[var(--forex-muted)] hover:text-[var(--forex-text)] transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            whileHover={{ scale: 1.1 }}
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1 rounded-md bg-white/[0.04] hover:bg-[var(--loss)]/20 text-[var(--forex-muted)] hover:text-[var(--loss)] transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </motion.button>
                        </motion.div>
                      )}

                      {/* Reaction counts display */}
                      {hasReactions && (
                        <div className={`flex items-center gap-1 mt-1 flex-wrap ${own ? 'justify-end' : ''}`}>
                          {Array.from(msgReactions!.entries()).map(([emoji, count]) => (
                            <motion.button
                              key={emoji}
                              whileTap={{ scale: 0.85 }}
                              onClick={() => toggleReaction(msg.id, emoji)}
                              className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-colors"
                            >
                              <span>{emoji}</span>
                              <span className="text-[9px] text-[var(--forex-muted)] font-mono">{count}</span>
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="flex items-center gap-2.5 mt-1"
              >
                <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-[10px] font-bold text-[var(--forex-muted)]">
                  Y
                </div>
                <div className="chat-bubble-in px-3 py-2">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--forex-muted)]/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--forex-muted)]/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--forex-muted)]/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Simulated other user typing */}
          <AnimatePresence>
            {otherTypingUser && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2.5 mt-1"
              >
                <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-[10px] font-bold text-[var(--forex-muted)]">
                  {otherTypingUser.charAt(0)}
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 chat-bubble-in">
                  <span className="text-[10px] text-[var(--forex-muted)]">{otherTypingUser}</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--forex-muted)]/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--forex-muted)]/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--forex-muted)]/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={() => setIsTyping(false)}
              placeholder={`Message #${activeChannel}`}
              rows={1}
              className="input-glass w-full px-4 py-2.5 rounded-xl text-sm resize-none max-h-24 overflow-y-auto text-[var(--forex-text)] placeholder:text-[var(--forex-muted)]"
              style={{ minHeight: '42px' }}
            />
          </div>
          <LiquidGlass>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="btn-3d p-2.5 rounded-xl glass text-[var(--forex-accent)] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </LiquidGlass>
        </div>
      </div>
    </div>
  );
}
