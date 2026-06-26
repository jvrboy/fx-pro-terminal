// src/lib/news_feed.ts
// Real-time financial news feed.

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
}

export async function fetchNewsFeed(query: string = "forex"): Promise<NewsArticle[]> {
  console.log(`📰 Fetching news for query: ${query}...`);
  
  // Mock implementation - replace with real API call
  return Array.from({ length: 5 }, (_, i) => ({
    title: `News Article ${i + 1} - ${query}`,
    description: `Description for news article ${i + 1} related to ${query}.`,
    url: `https://example.com/news/${i + 1}`,
    publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
    source: `Source ${i + 1}`,
  }));
}

export async function filterNewsByKeyword(articles: NewsArticle[], keyword: string): Promise<NewsArticle[]> {
  return articles.filter(article => article.title.includes(keyword) || article.description.includes(keyword));
}