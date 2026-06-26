import { NextResponse } from 'next/server';

const pairs = [
  { pair: 'EUR/USD', bid: 1.0865, ask: 1.0867, spread: 0.2, change: 0.0012, changePercent: 0.11, high: 1.0892, low: 1.0834, dailyRange: 0.0058 },
  { pair: 'GBP/USD', bid: 1.2734, ask: 1.2736, spread: 0.2, change: -0.0008, changePercent: -0.06, high: 1.2758, low: 1.2719, dailyRange: 0.0039 },
  { pair: 'USD/JPY', bid: 157.23, ask: 157.25, spread: 0.2, change: 0.45, changePercent: 0.29, high: 157.68, low: 156.82, dailyRange: 0.86 },
  { pair: 'USD/CHF', bid: 0.8823, ask: 0.8825, spread: 0.2, change: -0.0015, changePercent: -0.17, high: 0.8851, low: 0.8809, dailyRange: 0.0042 },
  { pair: 'AUD/USD', bid: 0.6542, ask: 0.6544, spread: 0.2, change: 0.0006, changePercent: 0.09, high: 0.6568, low: 0.6527, dailyRange: 0.0041 },
  { pair: 'USD/CAD', bid: 1.3645, ask: 1.3647, spread: 0.2, change: -0.0012, changePercent: -0.09, high: 1.3672, low: 1.3628, dailyRange: 0.0044 },
  { pair: 'NZD/USD', bid: 0.5978, ask: 0.5980, spread: 0.2, change: 0.0004, changePercent: 0.07, high: 0.6001, low: 0.5962, dailyRange: 0.0039 },
  { pair: 'EUR/GBP', bid: 0.8534, ask: 0.8536, spread: 0.2, change: 0.0018, changePercent: 0.21, high: 0.8556, low: 0.8512, dailyRange: 0.0044 },
];

const indices = [
  { name: 'DXY', value: 104.23, change: 0.15, changePercent: 0.14 },
  { name: 'S&P 500', value: 5642.18, change: 23.45, changePercent: 0.42 },
  { name: 'NASDAQ', value: 18234.67, change: 87.12, changePercent: 0.48 },
  { name: 'FTSE 100', value: 8247.32, change: -15.67, changePercent: -0.19 },
  { name: 'Nikkei 225', value: 38742.50, change: 312.00, changePercent: 0.81 },
  { name: 'DAX', value: 18452.18, change: 45.23, changePercent: 0.25 },
];

const commodities = [
  { name: 'Gold', price: 2432.50, unit: '$/oz', change: 12.30, changePercent: 0.51 },
  { name: 'Silver', price: 28.45, unit: '$/oz', change: -0.32, changePercent: -1.11 },
  { name: 'WTI Oil', price: 78.62, unit: '$/bbl', change: 1.24, changePercent: 1.60 },
  { name: 'Brent Oil', price: 82.15, unit: '$/bbl', change: 1.08, changePercent: 1.33 },
];

const correlations = [
  { pair1: 'EUR/USD', pair2: 'GBP/USD', value: 0.85 },
  { pair1: 'EUR/USD', pair2: 'AUD/USD', value: 0.62 },
  { pair1: 'EUR/USD', pair2: 'NZD/USD', value: 0.55 },
  { pair1: 'EUR/USD', pair2: 'USD/CHF', value: -0.92 },
  { pair1: 'EUR/USD', pair2: 'USD/JPY', value: -0.78 },
  { pair1: 'EUR/USD', pair2: 'USD/CAD', value: -0.71 },
  { pair1: 'GBP/USD', pair2: 'AUD/USD', value: 0.58 },
  { pair1: 'GBP/USD', pair2: 'NZD/USD', value: 0.48 },
  { pair1: 'GBP/USD', pair2: 'USD/CHF', value: -0.80 },
  { pair1: 'GBP/USD', pair2: 'USD/JPY', value: -0.65 },
  { pair1: 'GBP/USD', pair2: 'USD/CAD', value: -0.59 },
  { pair1: 'AUD/USD', pair2: 'NZD/USD', value: 0.88 },
  { pair1: 'AUD/USD', pair2: 'USD/CHF', value: -0.52 },
  { pair1: 'AUD/USD', pair2: 'USD/JPY', value: -0.42 },
  { pair1: 'AUD/USD', pair2: 'USD/CAD', value: -0.38 },
  { pair1: 'NZD/USD', pair2: 'USD/CHF', value: -0.45 },
  { pair1: 'NZD/USD', pair2: 'USD/JPY', value: -0.35 },
  { pair1: 'NZD/USD', pair2: 'USD/CAD', value: -0.32 },
  { pair1: 'USD/CHF', pair2: 'USD/JPY', value: 0.72 },
  { pair1: 'USD/CHF', pair2: 'USD/CAD', value: 0.68 },
  { pair1: 'USD/JPY', pair2: 'USD/CAD', value: 0.55 },
];

function jitter(value: number, range: number) {
  return +(value + (Math.random() - 0.5) * range).toFixed(4);
}

function getSessions() {
  const utcH = new Date().getUTCHours();
  const getStatus = (openH: number, closeH: number) => {
    if (closeH > openH) return utcH >= openH && utcH < closeH;
    return utcH >= openH || utcH < closeH;
  };
  return {
    asian: { status: getStatus(21, 6) ? 'open' : 'closed', high: 1.0892, low: 1.0834 },
    london: { status: getStatus(7, 16) ? 'open' : 'closed', high: 1.0892, low: 1.0834 },
    newyork: { status: getStatus(12, 21) ? 'open' : 'closed', high: 1.0892, low: 1.0834 },
  };
}

export async function GET() {
  try {
    const livePairs = pairs.map((p) => {
      const jpy = p.pair.includes('JPY');
      const jRange = jpy ? 0.15 : 0.0008;
      const bid = jpy ? jitter(p.bid, jRange) : jitter(p.bid, jRange);
      const ask = jpy ? jitter(p.ask, jRange) : jitter(p.ask, jRange);
      return {
        ...p,
        bid,
        ask,
        spread: +(ask - bid).toFixed(jpy ? 2 : 4),
        change: +(Math.random() - 0.48) * (jpy ? 0.5 : 0.002),
        changePercent: +(Math.random() - 0.48) * 0.3,
        high: jpy ? bid + 0.4 : bid + 0.003,
        low: jpy ? bid - 0.4 : bid - 0.003,
      };
    });

    const liveIndices = indices.map(i => ({
      ...i,
      value: jitter(i.value, i.value * 0.001),
      change: +(Math.random() - 0.45) * 30,
      changePercent: +(Math.random() - 0.45) * 0.5,
    }));

    const liveCommodities = commodities.map(c => ({
      ...c,
      price: jitter(c.price, c.price * 0.002),
      change: +(Math.random() - 0.45) * 5,
      changePercent: +(Math.random() - 0.45) * 2,
    }));

    const bullishCount = livePairs.filter(p => p.change > 0).length;
    const bearishCount = livePairs.filter(p => p.change < 0).length;
    const sentiment: 'bullish' | 'bearish' | 'neutral' = bullishCount > bearishCount ? 'bullish' : bearishCount > bullishCount ? 'bearish' : 'neutral';

    return NextResponse.json({
      pairs: livePairs,
      indices: liveIndices,
      commodities: liveCommodities,
      correlations,
      sessionSummary: getSessions(),
      volatilityIndex: +(40 + Math.random() * 60).toFixed(1),
      marketSentiment: sentiment,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching market overview:', error);
    return NextResponse.json({ error: 'Failed to fetch market overview' }, { status: 500 });
  }
}
