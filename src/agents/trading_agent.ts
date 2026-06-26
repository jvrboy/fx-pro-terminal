// src/agents/trading_agent.ts
// Automated trading agent that executes trades based on signals.

import { db } from "@/lib/db";
import { executeTrade } from "@/lib/trade_executor";
import { sendNotification } from "@/lib/notifications";

export class TradingAgent {
  private pair: string;
  private strategy: string;
  private riskPercent: number;

  constructor(pair: string, strategy: string, riskPercent: number) {
    this.pair = pair;
    this.strategy = strategy;
    this.riskPercent = riskPercent;
  }

  async executeSignal(signal: { action: "buy" | "sell", price: number, confidence: number }) {
    console.log(`🤖 Executing ${signal.action} for ${this.pair} at ${signal.price}`);
    
    try {
      const trade = await executeTrade(this.pair, signal.action, signal.price, this.riskPercent);
      await db.trades.create({
        data: {
          pair: this.pair,
          action: signal.action,
          price: signal.price,
          status: "executed",
          strategy: this.strategy,
        },
      });
      
      await sendNotification(`Trade Executed: ${signal.action.toUpperCase()} ${this.pair} at ${signal.price}`);
      return trade;
    } catch (error) {
      console.error("❌ Trade execution failed:", error);
      await sendNotification(`Trade Failed: ${signal.action.toUpperCase()} ${this.pair} at ${signal.price}`);
      throw error;
    }
  }

  async monitorPositions() {
    console.log(`🔍 Monitoring positions for ${this.pair}...`);
    const positions = await db.trades.findMany({
      where: { pair: this.pair, status: "executed" },
    });
    
    return positions;
  }
}