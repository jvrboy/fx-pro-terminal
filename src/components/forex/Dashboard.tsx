// src/components/forex/Dashboard.tsx
// Enhanced dashboard for FX Pro Terminal.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EconomicCalendar } from "./EconomicCalendar";
import { NewsFeed } from "./NewsFeed";
import { TradingAgents } from "./TradingAgents";
import { TechnicalIndicators } from "./TechnicalIndicators";

export function Dashboard() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">FX Pro Terminal</h1>
      
      <Tabs defaultValue="indicators" className="space-y-4">
        <TabsList>
          <TabsTrigger value="indicators">Technical Indicators</TabsTrigger>
          <TabsTrigger value="calendar">Economic Calendar</TabsTrigger>
          <TabsTrigger value="news">News Feed</TabsTrigger>
          <TabsTrigger value="agents">Trading Agents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="indicators">
          <TechnicalIndicators />
        </TabsContent>
        
        <TabsContent value="calendar">
          <EconomicCalendar />
        </TabsContent>
        
        <TabsContent value="news">
          <NewsFeed />
        </TabsContent>
        
        <TabsContent value="agents">
          <TradingAgents />
        </TabsContent>
      </Tabs>
    </div>
  );
}