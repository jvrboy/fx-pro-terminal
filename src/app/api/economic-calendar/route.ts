import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Seed economic events if empty
async function seedEvents() {
  const count = await db.economicEvent.count();
  if (count > 0) return;

  const now = new Date();
  const events = [
    // Today's events
    { eventDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30), currency: 'USD', impact: 'high', title: 'Non-Farm Payrolls', description: 'Change in the number of people employed during the previous month, excluding the farming industry.', actual: '216K', forecast: '180K', previous: '187K', category: 'employment', status: 'released' },
    { eventDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30), currency: 'USD', impact: 'high', title: 'Unemployment Rate', description: 'Percentage of the total labor force that is unemployed but actively seeking employment.', actual: '3.7%', forecast: '3.8%', previous: '3.9%', category: 'employment', status: 'released' },
    { eventDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0), currency: 'EUR', impact: 'high', title: 'ECB Interest Rate Decision', description: 'European Central Bank announces its monetary policy decision.', actual: null, forecast: '3.65%', previous: '3.65%', category: 'monetary_policy', status: 'upcoming' },
    { eventDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 30), currency: 'JPY', impact: 'medium', title: 'BOJ Monetary Policy Minutes', description: 'Bank of Japan releases minutes from the latest monetary policy meeting.', actual: null, forecast: null, previous: '-', category: 'monetary_policy', status: 'upcoming' },
    { eventDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0), currency: 'GBP', impact: 'high', title: 'UK CPI m/m', description: 'UK Consumer Price Index month-over-month change.', actual: null, forecast: '0.4%', previous: '0.3%', category: 'inflation', status: 'upcoming' },
    { eventDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 2, 30), currency: 'AUD', impact: 'medium', title: 'Australia Retail Sales m/m', description: 'Change in the total value of sales at the retail level.', actual: null, forecast: '0.3%', previous: '0.5%', category: 'economic', status: 'upcoming' },
    { eventDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 30), currency: 'CAD', impact: 'medium', title: 'Canada Trade Balance', description: 'Difference between exports and imports of Canadian goods and services.', actual: null, forecast: '-1.2B', previous: '-0.8B', category: 'trade', status: 'upcoming' },
    { eventDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 45), currency: 'EUR', impact: 'medium', title: 'German Manufacturing PMI', description: 'Purchasing Managers Index for the German manufacturing sector.', actual: null, forecast: '43.2', previous: '42.9', category: 'manufacturing', status: 'upcoming' },
    // Yesterday events
    { eventDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 8, 30), currency: 'USD', impact: 'medium', title: 'ADP Non-Farm Employment', description: 'Estimated change in the number of employed people during the previous month.', actual: '152K', forecast: '160K', previous: '188K', category: 'employment', status: 'historical' },
    { eventDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 0), currency: 'EUR', impact: 'high', title: 'Eurozone GDP q/q', description: 'Gross Domestic Product quarter-over-quarter for the Eurozone.', actual: '0.3%', forecast: '0.2%', previous: '0.1%', category: 'gdp', status: 'historical' },
    { eventDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 3, 50), currency: 'JPY', impact: 'high', title: 'Japan GDP q/q', description: 'Gross Domestic Product quarter-over-quarter for Japan.', actual: '0.1%', forecast: '-0.2%', previous: '-0.7%', category: 'gdp', status: 'historical' },
    { eventDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 7, 0), currency: 'GBP', impact: 'medium', title: 'UK Manufacturing PMI', description: 'Purchasing Managers Index for the UK manufacturing sector.', actual: '48.8', forecast: '48.5', previous: '47.8', category: 'manufacturing', status: 'historical' },
    // Tomorrow events
    { eventDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 30), currency: 'USD', impact: 'high', title: 'US CPI m/m', description: 'Consumer Price Index month-over-month change for the United States.', actual: null, forecast: '0.2%', previous: '0.3%', category: 'inflation', status: 'upcoming' },
    { eventDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 30), currency: 'USD', impact: 'high', title: 'Core CPI m/m', description: 'Core Consumer Price Index excluding food and energy.', actual: null, forecast: '0.3%', previous: '0.3%', category: 'inflation', status: 'upcoming' },
    { eventDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0), currency: 'NZD', impact: 'medium', title: 'NZ Dairy Auction', description: 'GlobalDairyTrade auction price index for New Zealand dairy products.', actual: null, forecast: null, previous: '1256', category: 'economic', status: 'upcoming' },
    // Two days ahead
    { eventDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 0, 30), currency: 'JPY', impact: 'high', title: 'BOJ Interest Rate Decision', description: 'Bank of Japan announces its monetary policy interest rate decision.', actual: null, forecast: '0.25%', previous: '0.25%', category: 'monetary_policy', status: 'upcoming' },
    { eventDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 8, 30), currency: 'USD', impact: 'medium', title: 'US Retail Sales m/m', description: 'Change in the total value of sales at the retail level in the US.', actual: null, forecast: '0.4%', previous: '0.6%', category: 'economic', status: 'upcoming' },
    { eventDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 7, 0), currency: 'GBP', impact: 'high', title: 'UK GDP m/m', description: 'UK Gross Domestic Product month-over-month change.', actual: null, forecast: '0.2%', previous: '0.1%', category: 'gdp', status: 'upcoming' },
  ];

  await db.economicEvent.createMany({ data: events });
}

export async function GET(request: Request) {
  try {
    await seedEvents();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const currency = searchParams.get('currency');
    const impact = searchParams.get('impact');
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const where: Record<string, unknown> = {};

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.eventDate = { gte: start, lte: end };
    }

    if (currency) where.currency = currency;
    if (impact) where.impact = impact;
    if (status) where.status = status;
    if (category) where.category = category;

    const events = await db.economicEvent.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { eventDate: 'asc' },
      take: 100,
    });

    // Get summary stats
    const totalEvents = events.length;
    const highImpact = events.filter(e => e.impact === 'high').length;
    const upcoming = events.filter(e => e.status === 'upcoming').length;
    const released = events.filter(e => e.status === 'released').length;

    return NextResponse.json({
      events,
      summary: { totalEvents, highImpact, upcoming, released },
    });
  } catch (error) {
    console.error('Error fetching economic calendar:', error);
    return NextResponse.json({ error: 'Failed to fetch economic calendar' }, { status: 500 });
  }
}
