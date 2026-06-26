// src/pipelines/trading_pipeline.ts
// Pipeline for executing trades based on signals.

import { TradingAgent } from "@/agents/trading_agent";
import { RiskManagementAgent } from "@/agents/risk_management_agent";
import { db } from "@/lib/db";

export async function runTradingPipeline(signal: {
  pair: string;
  action: "BUY" | "SELL";
  price: number;
  stopLoss: number;
  takeProfit: number;
}) {
  console.log(`🔄 Running trading pipeline for ${signal.pair}...`);
  
  // Initialize agents
  const tradingAgent = new TradingAgent(signal.pair);
  const riskAgent = new RiskManagementAgent(2, 5); // 2% risk per trade, 5% max daily loss
  
  // Check risk parameters
  const isRiskAcceptable = await riskAgent.checkRisk(signal);
  if (!isRiskAcceptable) {
    console.log(`❌ Risk check failed for ${signal.pair}. Trade aborted.`);
    return;
  }
  
  // Execute trade
  const tradeResult = await tradingAgent.executeTrade(signal);
  
  // Store trade in database
  await db.trade.create({
    data: {
      pair: signal.pair,
      action: signal.action,
      price: signal.price,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      timestamp: new Date(),
      status: tradeResult.success ? "EXECUTED" : "FAILED",
    },
  });
  
  console.log(`✅ Trading pipeline completed for ${signal.pair}.`);
}