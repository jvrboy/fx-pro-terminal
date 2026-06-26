// src/pipelines/data_pipeline.ts
// Pipeline for fetching and processing market data.

import { fetchMarketData } from "@/lib/market_data";
import { calculateIndicators } from "@/lib/indicators";
import { db } from "@/lib/db";

export async function runDataPipeline(pair: string, timeframe: string) {
  console.log(`🔄 Running data pipeline for ${pair} on ${timeframe} timeframe...`);
  
  // Fetch market data
  const marketData = await fetchMarketData(pair, timeframe);
  
  // Calculate indicators
  const indicators = calculateIndicators(marketData.prices);
  
  // Store in database
  await db.marketData.create({
    data: {
      pair,
      timeframe,
      prices: marketData.prices,
      indicators,
      timestamp: new Date(),
    },
  });
  
  console.log(`✅ Data pipeline completed for ${pair} on ${timeframe}.`);
}

function calculateIndicators(prices: number[]) {
  return {
    rsi: calculateRSI(prices),
    macd: calculateMACD(prices),
    bollingerBands: calculateBollingerBands(prices),
    ichimokuCloud: calculateIchimokuCloud(prices),
  };
}