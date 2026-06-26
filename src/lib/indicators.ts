// src/lib/indicators.ts
// Technical indicators for forex trading.

export function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(Math.max(change, 0));
    losses.push(Math.max(-change, 0));
  }
  
  for (let i = period; i < prices.length; i++) {
    const avgGain = gains.slice(i - period, i).reduce((sum, val) => sum + val, 0) / period;
    const avgLoss = losses.slice(i - period, i).reduce((sum, val) => sum + val, 0) / period;
    const rs = avgGain / avgLoss;
    const rsiValue = 100 - (100 / (1 + rs));
    rsi.push(rsiValue);
  }
  
  return rsi;
}

export function calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  const macdLine = fastEMA.map((val, i) => val - slowEMA[i]);
  const signalLine = calculateEMA(macdLine, signalPeriod);
  const histogram = macdLine.map((val, i) => val - signalLine[i]);
  
  return { macdLine, signalLine, histogram };
}

export function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
  const sma = calculateSMA(prices, period);
  const upperBand: number[] = [];
  const lowerBand: number[] = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const std = calculateStandardDeviation(slice);
    upperBand.push(sma[i] + stdDev * std);
    lowerBand.push(sma[i] - stdDev * std);
  }
  
  return { upperBand, lowerBand, sma };
}

export function calculateIchimokuCloud(prices: number[], tenkanPeriod: number = 9, kijunPeriod: number = 26, senkouSpanBPeriod: number = 52) {
  const tenkanSen = calculateTenkanSen(prices, tenkanPeriod);
  const kijunSen = calculateKijunSen(prices, kijunPeriod);
  const senkouSpanA = calculateSenkouSpanA(tenkanSen, kijunSen);
  const senkouSpanB = calculateSenkouSpanB(prices, senkouSpanBPeriod);
  
  return { tenkanSen, kijunSen, senkouSpanA, senkouSpanB };
}

// Helper functions
function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  ema.push(calculateSMA(prices.slice(0, period), period)[0]);
  
  for (let i = period; i < prices.length; i++) {
    const emaValue = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
    ema.push(emaValue);
  }
  
  return ema;
}

function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const avg = slice.reduce((sum, val) => sum + val, 0) / period;
    sma.push(avg);
  }
  
  return sma;
}

function calculateStandardDeviation(prices: number[]): number {
  const mean = prices.reduce((sum, val) => sum + val, 0) / prices.length;
  const squaredDiffs = prices.map(price => Math.pow(price - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / prices.length;
  return Math.sqrt(variance);
}

function calculateTenkanSen(prices: number[], period: number): number[] {
  const tenkanSen: number[] = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const max = Math.max(...slice);
    const min = Math.min(...slice);
    tenkanSen.push((max + min) / 2);
  }
  
  return tenkanSen;
}

function calculateKijunSen(prices: number[], period: number): number[] {
  const kijunSen: number[] = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const max = Math.max(...slice);
    const min = Math.min(...slice);
    kijunSen.push((max + min) / 2);
  }
  
  return kijunSen;
}

function calculateSenkouSpanA(tenkanSen: number[], kijunSen: number[]): number[] {
  return tenkanSen.map((val, i) => (val + kijunSen[i]) / 2);
}

function calculateSenkouSpanB(prices: number[], period: number): number[] {
  const senkouSpanB: number[] = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const max = Math.max(...slice);
    const min = Math.min(...slice);
    senkouSpanB.push((max + min) / 2);
  }
  
  return senkouSpanB;
}