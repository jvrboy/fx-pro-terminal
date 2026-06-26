import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const agentType = searchParams.get('agentType');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (sessionId) where.sessionId = sessionId;
    if (agentType) where.agentType = agentType;

    const memories = await db.agentMemory.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const totalMemories = await db.agentMemory.count();
    const sessions = await db.agentMemory.groupBy({
      by: ['sessionId'],
      _count: true,
    });

    return NextResponse.json({
      memories,
      totalMemories,
      sessionsCount: sessions.length,
      recentSessions: sessions.slice(0, 10),
    });
  } catch (error) {
    console.error('Error fetching memory:', error);
    return NextResponse.json({ error: 'Failed to fetch memory' }, { status: 500 });
  }
}
