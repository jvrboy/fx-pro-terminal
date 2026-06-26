export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar: string | null;
  role: string;
  content: string;
  channelId: string;
  createdAt: string;
}

export interface TradingSignal {
  id: string;
  userId: string;
  username: string;
  avatar: string | null;
  pair: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timeframe: string;
  status: 'active' | 'closed' | 'expired';
  confidence: number;
  analysis: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TradeHistory {
  id: string;
  pair: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  profit: number;
  pips: number;
  status: 'open' | 'closed' | 'cancelled';
  timeframe: string;
  openedAt: string;
  closedAt: string | null;
}

export interface MarketPair {
  pair: string;
  bid: number;
  ask: number;
  spread: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume?: number;
  dailyRange?: number;
}

export interface MarketOverviewData {
  pairs: MarketPair[];
  indices: MarketIndex[];
  commodities: CommodityData[];
  correlations: CorrelationData[];
  sessionSummary: SessionSummary;
  volatilityIndex: number;
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  timestamp: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface CommodityData {
  name: string;
  price: number;
  unit: string;
  change: number;
  changePercent: number;
}

export interface CorrelationData {
  pair1: string;
  pair2: string;
  value: number;
}

export interface SessionSummary {
  asian: { status: string; high: number; low: number };
  london: { status: string; high: number; low: number };
  newyork: { status: string; high: number; low: number };
}

export interface EconomicEvent {
  id: string;
  eventDate: string;
  currency: string;
  impact: 'high' | 'medium' | 'low';
  title: string;
  description: string | null;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  category: string;
  source: string;
  status: 'upcoming' | 'released' | 'historical';
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  darkMode: boolean;
  compactView: boolean;
  signalAlerts: boolean;
  priceAlerts: boolean;
  language: string;
  timezone: string;
  riskPerTrade: number;
  maxDailyTrades: number;
  maxDailyTradesUnlimited: boolean;
  preferredPairs: string[];
  autoScroll: boolean;
  showAvatars: boolean;
  agentAutoLearn: boolean;
  agentMemoryLimit: number;
  signalMonitorEnabled: boolean;
}

export interface AgentMemoryEntry {
  id: string;
  sessionId: string;
  agentType: string;
  signalId: string | null;
  eventType: string;
  context: string;
  analysis: string;
  outcome: string;
  lessonsLearned: string;
  accuracyScore: number;
  tags: string;
  createdAt: string;
  updatedAt: string;
}

export interface SignalAnalysisEntry {
  id: string;
  signalId: string;
  pair: string;
  direction: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  originalConfidence: number;
  adjustedConfidence: number;
  hitStopLoss: boolean;
  hitTakeProfit: boolean;
  slReason: string | null;
  marketCondition: string | null;
  volatility: string;
  sessionType: string;
  errorMargin: number;
  improvementNotes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentStatus {
  signalMonitor: { running: boolean; lastRun: string | null; signalsProcessed: number; accuracy: number };
  memoryEngine: { running: boolean; memoriesCount: number; sessionsAnalyzed: number };
  pipelineEngine: { running: boolean; pipelinesActive: number; lastExecution: string | null };
  selfTrainer: { running: boolean; trainingIterations: number; accuracyImprovement: number; lastTrained: string | null };
}
