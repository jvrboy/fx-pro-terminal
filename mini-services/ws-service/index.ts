import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

// ── Connection tracking ──────────────────────────────────────────────
let connectionCount = 0;

// ── Forex pair state ─────────────────────────────────────────────────
interface PairState {
  pair: string;
  baseBid: number;
  baseAsk: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  cumulativeChange: number;
}

const pairStates: PairState[] = [
  { pair: 'EUR/USD', baseBid: 1.0865, baseAsk: 1.0867, bid: 1.0865, ask: 1.0867, high: 1.0882, low: 1.0848, cumulativeChange: 0 },
  { pair: 'GBP/USD', baseBid: 1.2734, baseAsk: 1.2736, bid: 1.2734, ask: 1.2736, high: 1.2758, low: 1.2715, cumulativeChange: 0 },
  { pair: 'USD/JPY', baseBid: 157.23, baseAsk: 157.25, bid: 157.23, ask: 157.25, high: 157.68, low: 156.90, cumulativeChange: 0 },
  { pair: 'USD/CHF', baseBid: 0.8823, baseAsk: 0.8825, bid: 0.8823, ask: 0.8825, high: 0.8850, low: 0.8805, cumulativeChange: 0 },
  { pair: 'AUD/USD', baseBid: 0.6542, baseAsk: 0.6544, bid: 0.6542, ask: 0.6544, high: 0.6568, low: 0.6520, cumulativeChange: 0 },
  { pair: 'USD/CAD', baseBid: 1.3645, baseAsk: 1.3647, bid: 1.3645, ask: 1.3647, high: 1.3678, low: 1.3620, cumulativeChange: 0 },
  { pair: 'NZD/USD', baseBid: 0.5978, baseAsk: 0.5980, bid: 0.5978, ask: 0.5980, high: 0.6002, low: 0.5955, cumulativeChange: 0 },
  { pair: 'EUR/GBP', baseBid: 0.8534, baseAsk: 0.8536, bid: 0.8534, ask: 0.8536, high: 0.8560, low: 0.8510, cumulativeChange: 0 },
];

// ── Simulated signals pool ───────────────────────────────────────────
const signalTemplates = [
  { pair: 'EUR/USD', direction: 'BUY' as const, timeframe: 'H1', confidence: 78, analysis: 'Bullish divergence on RSI, price holding above 200 EMA. Strong support at 1.0850.' },
  { pair: 'GBP/USD', direction: 'SELL' as const, timeframe: 'M15', confidence: 65, analysis: 'Bearish engulfing at resistance. MACD crossover confirming downside momentum.' },
  { pair: 'USD/JPY', direction: 'BUY' as const, timeframe: 'H4', confidence: 82, analysis: 'Breakout above descending channel. BOJ policy meeting expectations supporting yen weakness.' },
  { pair: 'AUD/USD', direction: 'BUY' as const, timeframe: 'H1', confidence: 71, analysis: 'Double bottom formation near 0.6520 support. Commodity prices supporting the upside.' },
  { pair: 'USD/CAD', direction: 'SELL' as const, timeframe: 'D1', confidence: 74, analysis: 'Oil inventory drawdown bullish for CAD. Rising wedge on USD/CAD suggests reversal.' },
  { pair: 'EUR/GBP', direction: 'BUY' as const, timeframe: 'M30', confidence: 68, analysis: 'GBP weakness on soft UK data. EUR/GBP approaching key resistance at 0.8560.' },
  { pair: 'NZD/USD', direction: 'SELL' as const, timeframe: 'H1', confidence: 60, analysis: 'RBNZ rate cut expectations weighing on NZD. Resistance at 0.6000 holding firm.' },
  { pair: 'USD/CHF', direction: 'BUY' as const, timeframe: 'H4', confidence: 76, analysis: 'SNB dovish stance. Price bouncing off 0.8800 support with increasing volume.' },
];

let signalIndex = 0;

// ── Economic events pool ─────────────────────────────────────────────
const economicEvents = [
  { currency: 'USD', impact: 'high' as const, title: 'Non-Farm Payrolls', forecast: '180K', previous: '175K', category: 'Employment' },
  { currency: 'USD', impact: 'high' as const, title: 'CPI (YoY)', forecast: '3.1%', previous: '3.2%', category: 'Inflation' },
  { currency: 'EUR', impact: 'high' as const, title: 'ECB Interest Rate Decision', forecast: '3.65%', previous: '3.65%', category: 'Central Bank' },
  { currency: 'GBP', impact: 'high' as const, title: 'UK GDP (QoQ)', forecast: '0.3%', previous: '0.1%', category: 'GDP' },
  { currency: 'USD', impact: 'medium' as const, title: 'ISM Manufacturing PMI', forecast: '49.5', previous: '48.7', category: 'Business' },
  { currency: 'JPY', impact: 'high' as const, title: 'BOJ Policy Rate', forecast: '0.10%', previous: '0.10%', category: 'Central Bank' },
  { currency: 'AUD', impact: 'medium' as const, title: 'RBA Rate Statement', forecast: '-', previous: '-', category: 'Central Bank' },
  { currency: 'CAD', impact: 'medium' as const, title: 'Canada Employment Change', forecast: '25K', previous: '22K', category: 'Employment' },
  { currency: 'EUR', impact: 'medium' as const, title: 'German ZEW Economic Sentiment', forecast: '15.0', previous: '12.8', category: 'Business' },
  { currency: 'USD', impact: 'high' as const, title: 'FOMC Meeting Minutes', forecast: '-', previous: '-', category: 'Central Bank' },
  { currency: 'GBP', impact: 'medium' as const, title: 'UK CPI (YoY)', forecast: '4.0%', previous: '4.2%', category: 'Inflation' },
  { currency: 'NZD', impact: 'medium' as const, title: 'NZ GDP (QoQ)', forecast: '0.3%', previous: '-0.1%', category: 'GDP' },
];

let eventIndex = 0;

// ── Bot chat messages ────────────────────────────────────────────────
const botMessages = [
  { userId: 'bot-analyst', username: 'MarketAnalyst', role: 'lead_analyst', content: 'EUR/USD holding above the 1.0850 support level. Expecting a retest of the highs later today.' },
  { userId: 'bot-trader', username: 'FXHunter', role: 'senior_trader', content: 'Took profit on GBP/USD short at 1.2720. Looking for another entry on a pullback.' },
  { userId: 'bot-trader2', username: 'CurrencyKing', role: 'senior_trader', content: 'USD/JPY breakout above 157.50 looks imminent. Will wait for close above resistance.' },
  { userId: 'bot-analyst', username: 'MarketAnalyst', role: 'lead_analyst', content: 'Gold pushing higher, watch for correlation impact on AUD/USD and NZD/USD pairs.' },
  { userId: 'bot-trader', username: 'FXHunter', role: 'senior_trader', content: 'NFP expectations suggest a stronger dollar. Consider reducing long positions on majors.' },
  { userId: 'bot-trader2', username: 'CurrencyKing', role: 'senior_trader', content: 'EUR/GBP testing the 0.8540 resistance. A break could signal further GBP weakness.' },
  { userId: 'bot-analyst', username: 'MarketAnalyst', role: 'lead_analyst', content: 'Risk sentiment improving across markets. Carry trades are back in focus for the session.' },
  { userId: 'bot-trader', username: 'FXHunter', role: 'senior_trader', content: 'USD/CAD breaking below 1.3630 support. Oil inventory data driving the move.' },
  { userId: 'bot-trader2', username: 'CurrencyKing', role: 'senior_trader', content: 'NZD/USD bouncing off the 0.5960 support. RBNZ meeting next week is the key catalyst.' },
  { userId: 'bot-analyst', username: 'MarketAnalyst', role: 'lead_analyst', content: 'Swiss franc weakening as SNB signals more dovish stance ahead. USD/CHF targeting 0.8860.' },
];

let botMsgIndex = 0;
let chatMessageCount = 5;

// ── Price jitter engine ──────────────────────────────────────────────
function jitterPrices() {
  const now = Date.now();

  return pairStates.map((p) => {
    const isJPY = p.pair.includes('JPY');
    const maxJitter = isJPY ? 0.05 : 0.0004;
    const jitter = (Math.random() - 0.5) * maxJitter;
    const spread = isJPY ? 0.02 : 0.0002;

    p.bid = +(p.bid + jitter).toFixed(isJPY ? 3 : 5);
    p.ask = +(p.bid + spread).toFixed(isJPY ? 3 : 5);

    // Track cumulative change from base
    p.cumulativeChange += jitter;
    if (p.bid > p.high) p.high = p.bid;
    if (p.bid < p.low) p.low = p.bid;

    const change = +(p.bid - p.baseBid).toFixed(isJPY ? 3 : 5);
    const changePercent = +((p.bid - p.baseBid) / p.baseBid * 100).toFixed(3);

    return {
      pair: p.pair,
      bid: p.bid,
      ask: p.ask,
      spread: +spread.toFixed(isJPY ? 3 : 4),
      change,
      changePercent,
      high: p.high,
      low: p.low,
      timestamp: now,
    };
  });
}

// ── Price feed: every 2 seconds ──────────────────────────────────────
setInterval(() => {
  const prices = jitterPrices();
  io.to('market').emit('market:prices', prices);
}, 2000);

// ── Signal feed: every 30 seconds ────────────────────────────────────
setInterval(() => {
  const tpl = signalTemplates[signalIndex % signalTemplates.length];
  signalIndex++;

  const isJPY = tpl.pair.includes('JPY');
  const decimals = isJPY ? 3 : 5;
  const entryPrice = +(pairStates.find(p => p.pair === tpl.pair)?.bid ?? 0).toFixed(decimals);
  const slPips = isJPY ? 50 : 0.005;
  const tpPips = isJPY ? 100 : 0.01;
  const direction = tpl.direction;

  const signal = {
    id: `sig-${Date.now()}`,
    userId: 'bot-signal',
    username: 'SignalBot',
    avatar: null,
    pair: tpl.pair,
    direction,
    entryPrice: direction === 'BUY' ? entryPrice : entryPrice,
    stopLoss: direction === 'BUY'
      ? +(entryPrice - slPips).toFixed(decimals)
      : +(entryPrice + slPips).toFixed(decimals),
    takeProfit: direction === 'BUY'
      ? +(entryPrice + tpPips).toFixed(decimals)
      : +(entryPrice - tpPips).toFixed(decimals),
    timeframe: tpl.timeframe,
    status: 'active' as const,
    confidence: tpl.confidence,
    analysis: tpl.analysis,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  io.to('market').emit('signal:new', signal);
  console.log(`[signal] ${signal.direction} ${signal.pair} @ ${signal.entryPrice} (${signal.confidence}% confidence)`);
}, 30_000);

// ── Economic event feed: every 45 seconds ────────────────────────────
setInterval(() => {
  const tpl = economicEvents[eventIndex % economicEvents.length];
  eventIndex++;

  const actuals: Record<string, string> = {
    '180K': '195K',
    '3.1%': '3.3%',
    '49.5': '50.2',
    '25K': '32K',
    '15.0': '18.5',
    '0.3%': '0.4%',
    '4.0%': '3.8%',
  };

  const actual = actuals[tpl.forecast] ?? (tpl.forecast === '-' ? null : tpl.forecast);

  const event = {
    id: `evt-${Date.now()}`,
    eventDate: new Date().toISOString(),
    currency: tpl.currency,
    impact: tpl.impact,
    title: tpl.title,
    description: `${tpl.currency} ${tpl.title} released.`,
    actual,
    forecast: tpl.forecast,
    previous: tpl.previous,
    category: tpl.category,
    source: 'ws-service-simulator',
    status: 'released' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  io.to('market').emit('market:event', event);
  console.log(`[event] ${event.currency} ${event.title}: actual=${event.actual} forecast=${event.forecast}`);
}, 45_000);

// ── Bot chat: every 15-25 seconds ───────────────────────────────────
function sendBotMessage() {
  const msg = botMessages[botMsgIndex % botMessages.length];
  botMsgIndex++;
  chatMessageCount++;

  const chatMsg = {
    id: `bot-${Date.now()}`,
    userId: msg.userId,
    username: msg.username,
    avatar: null,
    role: msg.role,
    content: msg.content,
    channelId: 'general',
    createdAt: new Date().toISOString(),
  };

  io.to('market').emit('chat:message', chatMsg);
  io.to('market').emit('chat:count', chatMessageCount);

  const nextDelay = 15_000 + Math.random() * 10_000;
  setTimeout(sendBotMessage, nextDelay);
}

setTimeout(sendBotMessage, 8_000);

// ── Connection handling ──────────────────────────────────────────────
io.on('connection', (socket) => {
  connectionCount++;
  console.log(`[connect] ${socket.id} — total connections: ${connectionCount}`);

  // Assign to market room
  socket.join('market');

  // Send welcome message
  socket.emit('welcome', {
    message: 'Connected to Forex Trading WebSocket Service',
    serverTime: new Date().toISOString(),
    activeConnections: connectionCount,
  });

  // Send initial price snapshot
  const prices = jitterPrices();
  socket.emit('market:prices', prices);

  // Send current chat count
  socket.emit('chat:count', chatMessageCount);

  // Handle incoming chat messages — broadcast to all
  socket.on('chat:message', (msg: {
    userId?: string;
    username?: string;
    role?: string;
    content: string;
    channelId?: string;
  }) => {
    chatMessageCount++;

    const broadcastMsg = {
      id: `msg-${Date.now()}`,
      userId: msg.userId ?? 'unknown',
      username: msg.username ?? 'Trader',
      avatar: null,
      role: msg.role ?? 'trader',
      content: msg.content,
      channelId: msg.channelId ?? 'general',
      createdAt: new Date().toISOString(),
    };

    io.to('market').emit('chat:message', broadcastMsg);
    io.to('market').emit('chat:count', chatMessageCount);
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    connectionCount = Math.max(0, connectionCount - 1);
    console.log(`[disconnect] ${socket.id} (${reason}) — total connections: ${connectionCount}`);
  });
});

// ── Start server ─────────────────────────────────────────────────────
const PORT = 3003;
httpServer.listen(PORT, () => {
  console.log(`✅ ws-service (Socket.IO) running on port ${PORT}`);
  console.log(`   Events: market:prices | chat:message | signal:new | market:event`);
  console.log(`   Room:   market`);
});