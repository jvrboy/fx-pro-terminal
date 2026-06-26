// src/agents/risk_management_agent.ts
// Agent that ensures trades adhere to risk parameters.

import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";

export class RiskManagementAgent {
  private maxRiskPercent: number;
  private maxDailyLoss: number;

  constructor(maxRiskPercent: number = 2, maxDailyLoss: number = 5) {
    this.maxRiskPercent = maxRiskPercent;
    this.maxDailyLoss = maxDailyLoss;
  }

  async validateTrade(pair: string, action: "buy" | "sell", price: number, riskPercent: number) {
    console.log(`🛡️ Validating trade for ${pair}...`);
    
    if (riskPercent > this.maxRiskPercent) {
      throw new Error(`Risk per trade (${riskPercent}%) exceeds maximum allowed (${this.maxRiskPercent}%)`);
    }
    
    const dailyLoss = await this.calculateDailyLoss();
    if (dailyLoss >= this.maxDailyLoss) {
      throw new Error(`Daily loss limit (${this.maxDailyLoss}%) exceeded`);
    }
    
    return true;
  }

  async calculateDailyLoss() {
    const trades = await db.trades.findMany({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        status: "executed",
      },
    });
    
    const totalLoss = trades.reduce((sum, trade) => {
      return sum + (trade.profit < 0 ? Math.abs(trade.profit) : 0);
    }, 0);
    
    const accountBalance = await db.account.findUnique({
      where: { id: 1 },
    });
    
    return (totalLoss / (accountBalance?.balance || 1)) * 100;
  }

  async monitorRisk() {
    console.log(`🔍 Monitoring risk exposure...`);
    const dailyLoss = await this.calculateDailyLoss();
    
    if (dailyLoss >= this.maxDailyLoss * 0.8) {
      await sendNotification(`⚠️ Warning: Daily loss at ${dailyLoss.toFixed(2)}%`);
    }
    
    return dailyLoss;
  }
}