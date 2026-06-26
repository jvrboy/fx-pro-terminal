import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const trades = await db.tradeHistory.findMany({
      include: { user: { select: { id: true, username: true, avatar: true } } },
      orderBy: { openedAt: 'desc' },
      take: 100,
    });

    // Calculate summary stats
    const totalTrades = trades.length;
    const closedTrades = trades.filter(t => t.status === 'closed');
    const wins = closedTrades.filter(t => t.profit > 0).length;
    const winRate = closedTrades.length > 0 ? Math.round((wins / closedTrades.length) * 100) : 0;
    const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
    const totalPips = trades.reduce((sum, t) => sum + t.pips, 0);

    return NextResponse.json({
      trades,
      stats: { totalTrades, winRate, totalProfit, totalPips },
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
