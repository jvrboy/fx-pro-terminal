import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function calculatePips(pair: string, from: number, to: number): number {
  const isJPY = pair.toUpperCase().includes('JPY');
  const multiplier = isJPY ? 100 : 10000;
  return Math.abs(from - to) * multiplier;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pair, direction, entryPrice, stopLoss, takeProfit, lotSize, timeframe, userId } = body;

    if (!pair || !direction || !entryPrice || !stopLoss || !takeProfit) {
      return NextResponse.json(
        { error: 'Missing required fields: pair, direction, entryPrice, stopLoss, takeProfit' },
        { status: 400 },
      );
    }

    if (!['BUY', 'SELL', 'buy', 'sell'].includes(direction)) {
      return NextResponse.json({ error: 'Invalid direction. Must be BUY or SELL' }, { status: 400 });
    }

    if (entryPrice <= 0 || stopLoss <= 0 || takeProfit <= 0 || (lotSize != null && lotSize <= 0)) {
      return NextResponse.json({ error: 'Prices and lot size must be positive numbers' }, { status: 400 });
    }

    const isBuy = direction.toUpperCase() === 'BUY';

    if (isBuy && stopLoss >= entryPrice) {
      return NextResponse.json({ error: 'For BUY trades, stopLoss must be below entryPrice' }, { status: 400 });
    }
    if (isBuy && takeProfit <= entryPrice) {
      return NextResponse.json({ error: 'For BUY trades, takeProfit must be above entryPrice' }, { status: 400 });
    }
    if (!isBuy && stopLoss <= entryPrice) {
      return NextResponse.json({ error: 'For SELL trades, stopLoss must be above entryPrice' }, { status: 400 });
    }
    if (!isBuy && takeProfit >= entryPrice) {
      return NextResponse.json({ error: 'For SELL trades, takeProfit must be below entryPrice' }, { status: 400 });
    }

    const slPips = calculatePips(pair, entryPrice, stopLoss);
    const tpPips = calculatePips(pair, entryPrice, takeProfit);

    // Ensure user exists (upsert) to satisfy FK constraint
    const uid = userId || 'system';
    await db.user.upsert({
      where: { id: uid },
      update: {},
      create: { id: uid, username: uid === 'system' ? 'System' : 'Anonymous', role: 'trader' },
    });

    // Create TradingSignal record with status 'executed'
    const signal = await db.tradingSignal.create({
      data: {
        userId: uid,
        pair,
        direction: direction.toUpperCase(),
        entryPrice: parseFloat(entryPrice),
        stopLoss: parseFloat(stopLoss),
        takeProfit: parseFloat(takeProfit),
        timeframe: timeframe || 'H1',
        status: 'executed',
        confidence: 100,
        analysis: null,
      },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });

    // Create TradeHistory record with status 'open'
    const trade = await db.tradeHistory.create({
      data: {
        userId: uid,
        pair,
        direction: direction.toUpperCase(),
        entryPrice: parseFloat(entryPrice),
        exitPrice: 0,
        stopLoss: parseFloat(stopLoss),
        takeProfit: parseFloat(takeProfit),
        lotSize: parseFloat(lotSize) || 0.01,
        profit: 0,
        pips: 0,
        status: 'open',
        timeframe: timeframe || 'H1',
        openedAt: new Date(),
        closedAt: null,
      },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });

    return NextResponse.json(
      {
        signal,
        trade,
        calculatedPips: {
          stopLossPips: Math.round(slPips * 10) / 10,
          takeProfitPips: Math.round(tpPips * 10) / 10,
          riskRewardRatio: slPips > 0 ? Math.round((tpPips / slPips) * 100) / 100 : 0,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error executing trade:', error);
    return NextResponse.json({ error: 'Failed to execute trade' }, { status: 500 });
  }
}
