// src/lib/economic_calendar.ts
// Fetch and display economic events.

interface EconomicEvent {
  date: string;
  time: string;
  currency: string;
  impact: "Low" | "Medium" | "High";
  event: string;
  actual: string;
  forecast: string;
  previous: string;
}

export async function fetchEconomicCalendar(days: number = 7): Promise<EconomicEvent[]> {
  console.log(`📅 Fetching economic calendar for the next ${days} days...`);
  
  // Mock implementation - replace with real API call
  return Array.from({ length: 10 }, (_, i) => ({
    date: new Date(Date.now() + i * 86400000).toISOString().split("T")[0],
    time: `${Math.floor(Math.random() * 24)}:${Math.floor(Math.random() * 60)}`,
    currency: ["USD", "EUR", "GBP", "JPY"][Math.floor(Math.random() * 4)],
    impact: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)] as "Low" | "Medium" | "High",
    event: `Economic Event ${i + 1}`,
    actual: (Math.random() * 10).toFixed(2),
    forecast: (Math.random() * 10).toFixed(2),
    previous: (Math.random() * 10).toFixed(2),
  }));
}

export async function filterEventsByCurrency(events: EconomicEvent[], currency: string): Promise<EconomicEvent[]> {
  return events.filter(event => event.currency === currency);
}