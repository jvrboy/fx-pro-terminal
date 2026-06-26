import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface JournalEntry {
  id: string;
  pair: string;
  entryType: string;
  emotionalState: string;
  marketCondition: string;
  preAnalysis: string;
  postNotes: string;
  rating: number;
  lessonsLearned: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = searchParams.get('search') || '';

    const allSettings = await db.appSettings.findMany({
      where: {
        key: { startsWith: 'journal_entry_' },
      },
      orderBy: { createdAt: 'desc' },
    });

    let entries: JournalEntry[] = allSettings
      .map((setting) => {
        try {
          const parsed = JSON.parse(setting.value) as JournalEntry;
          return { ...parsed, id: setting.key };
        } catch {
          return null;
        }
      })
      .filter((entry): entry is JournalEntry => entry !== null);

    // Apply search filter
    if (search) {
      const query = search.toLowerCase();
      entries = entries.filter(
        (entry) =>
          entry.pair?.toLowerCase().includes(query) ||
          entry.emotionalState?.toLowerCase().includes(query) ||
          entry.marketCondition?.toLowerCase().includes(query) ||
          entry.preAnalysis?.toLowerCase().includes(query) ||
          entry.postNotes?.toLowerCase().includes(query) ||
          entry.lessonsLearned?.toLowerCase().includes(query) ||
          entry.tags?.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    const total = entries.length;
    const paginatedEntries = entries.slice(offset, offset + limit);

    return NextResponse.json({ entries: paginatedEntries, total });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pair, entryType, emotionalState, marketCondition, preAnalysis, postNotes, rating, lessonsLearned, tags } = body;

    if (!pair || !entryType) {
      return NextResponse.json({ error: 'Missing required fields: pair, entryType' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const entryId = `journal_entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const entry: JournalEntry = {
      id: entryId,
      pair,
      entryType,
      emotionalState: emotionalState || 'neutral',
      marketCondition: marketCondition || 'unknown',
      preAnalysis: preAnalysis || '',
      postNotes: postNotes || '',
      rating: rating ?? 5,
      lessonsLearned: lessonsLearned || '',
      tags: Array.isArray(tags) ? tags : [],
      createdAt: now,
      updatedAt: now,
    };

    await db.appSettings.create({
      data: {
        key: entryId,
        value: JSON.stringify(entry),
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 });
    }

    // id is the AppSettings key (e.g. "journal_entry_171...")
    const setting = await db.appSettings.findUnique({
      where: { key: id },
    });

    if (!setting) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
    }

    await db.appSettings.delete({
      where: { key: id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return NextResponse.json({ error: 'Failed to delete journal entry' }, { status: 500 });
  }
}