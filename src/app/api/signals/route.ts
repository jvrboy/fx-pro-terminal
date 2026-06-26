import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const signals = await db.tradingSignal.findMany({
      include: { user: { select: { id: true, username: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ signals });
  } catch (error) {
    console.error('Error fetching signals:', error);
    return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pair, direction, entryPrice, stopLoss, takeProfit, timeframe, confidence, analysis, userId } = body;

    if (!pair || !direction || !entryPrice || !stopLoss || !takeProfit || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const signal = await db.tradingSignal.create({
      data: {
        userId,
        pair,
        direction,
        entryPrice,
        stopLoss,
        takeProfit,
        timeframe: timeframe || 'H1',
        confidence: confidence || 75,
        analysis: analysis || null,
        status: 'active',
      },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });

    return NextResponse.json({ signal }, { status: 201 });
  } catch (error) {
    console.error('Error creating signal:', error);
    return NextResponse.json({ error: 'Failed to create signal' }, { status: 500 });
  }
}
