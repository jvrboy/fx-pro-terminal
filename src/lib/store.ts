import { create } from 'zustand';
import type { ChatMessage, MarketPair, AgentStatus } from '@/types/forex';

export type TabId = 'chat' | 'signals' | 'history' | 'economy' | 'market' | 'settings';

interface ForexState {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  currentUser: {
    id: string;
    username: string;
    avatar: string | null;
    role: string;
  };
  setCurrentUser: (user: ForexState['currentUser']) => void;
  notifications: number;
  setNotifications: (count: number) => void;

  // Real-time market prices from socket
  livePrices: MarketPair[];
  setLivePrices: (prices: MarketPair[]) => void;

  // Chat messages from socket
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  chatMessageCount: number;
  setChatMessageCount: (count: number) => void;

  // Sound enabled
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;

  // Socket connected
  socketConnected: boolean;
  setSocketConnected: (connected: boolean) => void;

  // Socket send function (set by page.tsx from useSocketIO hook)
  sendChatMessage: (msg: {
    userId: string;
    username: string;
    role: string;
    content: string;
    channelId: string;
  }) => void;
  setSendChatMessage: (fn: ForexState['sendChatMessage']) => void;

  // Toast notifications
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info'; duration?: number }>;
  addToast: (toast: Omit<ForexState['toasts'][number], 'id'>) => void;
  removeToast: (id: string) => void;

  // Agent status (background agents)
  agentStatus: AgentStatus | null;
  setAgentStatus: (status: AgentStatus) => void;
}

export const useForexStore = create<ForexState>((set) => ({
  activeTab: 'signals',
  setActiveTab: (tab) => set({ activeTab: tab }),
  currentUser: {
    id: 'user-1',
    username: 'TraderPro',
    avatar: null,
    role: 'senior_trader',
  },
  setCurrentUser: (user) => set({ currentUser: user }),
  notifications: 3,
  setNotifications: (count) => set({ notifications: count }),

  livePrices: [],
  setLivePrices: (prices) => set({ livePrices: prices }),

  chatMessages: [],
  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  chatMessageCount: 0,
  setChatMessageCount: (count) => set({ chatMessageCount: count }),

  soundEnabled: false,
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

  socketConnected: false,
  setSocketConnected: (connected) => set({ socketConnected: connected }),

  sendChatMessage: () => {},
  setSendChatMessage: (fn) => set({ sendChatMessage: fn }),

  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  agentStatus: null,
  setAgentStatus: (status) => set({ agentStatus: status }),
}));
