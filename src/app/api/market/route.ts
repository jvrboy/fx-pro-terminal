import { NextResponse } from 'next/server';

const pairs = [
  { pair: 'EUR/USD', bid: 1.0865, ask: 1.0867, spread: 0.2 },
  { pair: 'GBP/USD', bid: 1.2734, ask: 1.2736, spread: 0.2 },
  { pair: 'USD/JPY', bid: 157.23, ask: 157.25, spread: 0.2 },
  { pair: 'USD/CHF', bid: 0.8823, ask: 0.8825, spread: 0.2 },
  { pair: 'AUD/USD', bid: 0.6542, ask: 0.6544, spread: 0.2 },
  { pair: 'USD/CAD', bid: 1.3645, ask: 1.3647, spread: 0.2 },
  { pair: 'NZD/USD', bid: 0.5978, ask: 0.5980, spread: 0.2 },
  { pair: 'EUR/GBP', bid: 0.8534, ask: 0.8536, spread: 0.2 },
];

// Add random variation to simulate live prices
function jitter(value: number, range: number) {
  return +(value + (Math.random() - 0.5) * range).toFixed(4);
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

    return NextResponse.json({ pairs: livePairs, timestamp: Date.now() });
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}
