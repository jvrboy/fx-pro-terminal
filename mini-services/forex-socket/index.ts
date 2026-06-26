import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

// Forex pairs for live simulation
const pairs = [
  { pair: 'EUR/USD', bid: 1.0865, ask: 1.0867 },
  { pair: 'GBP/USD', bid: 1.2734, ask: 1.2736 },
  { pair: 'USD/JPY', bid: 157.23, ask: 157.25 },
  { pair: 'USD/CHF', bid: 0.8823, ask: 0.8825 },
  { pair: 'AUD/USD', bid: 0.6542, ask: 0.6544 },
  { pair: 'USD/CAD', bid: 1.3645, ask: 1.3647 },
  { pair: 'NZD/USD', bid: 0.5978, ask: 0.5980 },
  { pair: 'EUR/GBP', bid: 0.8534, ask: 0.8536 },
];

// Simple bot messages
const botMessages = [
  { userId: 'bot-analyst', username: 'MarketAnalyst', role: 'lead_analyst', content: 'EUR/USD holding above the 1.0850 support level. Expecting a retest of the highs later today.' },
  { userId: 'bot-trader', username: 'FXHunter', role: 'senior_trader', content: 'Took profit on GBP/USD short at 1.2720. Looking for another entry on a pullback.' },
  { userId: 'bot-trader2', username: 'CurrencyKing', role: 'senior_trader', content: 'USD/JPY breakout above 157.50 looks imminent. Will wait for close above resistance.' },
  { userId: 'bot-analyst', username: 'MarketAnalyst', role: 'lead_analyst', content: 'Gold pushing higher, watch for correlation impact on AUD/USD and NZD/USD pairs.' },
  { userId: 'bot-trader', username: 'FXHunter', role: 'senior_trader', content: 'NFP expectations suggest a stronger dollar. Consider reducing long positions.' },
  { userId: 'bot-trader2', username: 'CurrencyKing', role: 'senior_trader', content: 'EUR/GBP testing the 0.8540 resistance. A break could signal further GBP weakness.' },
  { userId: 'bot-analyst', username: 'MarketAnalyst', role: 'lead_analyst', content: 'Risk sentiment improving across markets. Carry trades are back in focus.' },
  { userId: 'bot-trader', username: 'FXHunter', role: 'senior_trader', content: 'USD/CAD breaking below 1.3630 support. Oil inventory data driving the move.' },
];

let botMsgIndex = 0;
let chatMessageCount = 5; // starting count

function jitterPair(pair: typeof pairs[0]) {
  const jpy = pair.pair.includes('JPY');
  const j = jpy ? (Math.random() - 0.5) * 0.04 : (Math.random() - 0.5) * 0.0003;
  return {
    ...pair,
    bid: +(pair.bid + j).toFixed(jpy ? 2 : 4),
    ask: +(pair.ask + j).toFixed(jpy ? 2 : 4),
    change: +(j * 100).toFixed(jpy ? 3 : 6),
    changePercent: +(j / pair.bid * 10000).toFixed(2),
  };
}

// Price tick every 1.5 seconds
setInterval(() => {
  const updated = pairs.map(jitterPair);
  io.emit('prices', updated);
}, 1500);

// Bot chat messages every 15-25 seconds
function sendBotMessage() {
  const msg = botMessages[botMsgIndex % botMessages.length];
  botMsgIndex++;
  chatMessageCount++;

  io.emit('chat:message', {
    id: `bot-${Date.now()}`,
    userId: msg.userId,
    username: msg.username,
    role: msg.role,
    avatar: null,
    content: msg.content,
    channelId: 'general',
    createdAt: new Date().toISOString(),
  });

  io.emit('chat:count', chatMessageCount);

  const nextDelay = 15000 + Math.random() * 10000;
  setTimeout(sendBotMessage, nextDelay);
}

setTimeout(sendBotMessage, 10000);

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send initial prices
  socket.emit('prices', pairs);
  socket.emit('chat:count', chatMessageCount);

  // Handle incoming chat messages
  socket.on('chat:message', (msg) => {
    chatMessageCount++;
    // Broadcast to all clients including sender
    io.emit('chat:message', {
      id: `msg-${Date.now()}`,
      userId: msg.userId || 'unknown',
      username: msg.username || 'Trader',
      role: msg.role || 'trader',
      avatar: null,
      content: msg.content,
      channelId: msg.channelId || 'general',
      createdAt: new Date().toISOString(),
    });
    io.emit('chat:count', chatMessageCount);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = 3003;
httpServer.listen(PORT, () => {
  console.log(`Forex Socket.IO server running on port ${PORT}`);
});
