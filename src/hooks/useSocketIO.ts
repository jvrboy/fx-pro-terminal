'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useForexStore } from '@/lib/store';
import type { ChatMessage, MarketPair, TradingSignal } from '@/types/forex';

export function useSocketIO() {
  const socketRef = useRef<Socket | null>(null);
  const {
    setLivePrices,
    addChatMessage,
    setChatMessageCount,
    setSocketConnected,
    setNotifications,
  } = useForexStore();

  useEffect(() => {
    const socket = io('/?XTransformPort=3003', {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 3000,
      timeout: 20000,
    });

    socketRef.current = socket;

    let receivedData = false;
    const markConnected = () => {
      if (!receivedData) {
        receivedData = true;
        setSocketConnected(true);
      }
    };

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('connect_error', () => {
      setSocketConnected(false);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    // Live price feed from ws-service
    socket.on('market:prices', (data: { pairs: MarketPair[] }) => {
      markConnected();
      if (data.pairs) setLivePrices(data.pairs);
    });

    // Legacy price event support
    socket.on('prices', (data: MarketPair[]) => {
      markConnected();
      setLivePrices(data);
    });

    // Chat messages
    socket.on('chat:message', (msg: ChatMessage) => {
      markConnected();
      addChatMessage(msg);
    });

    socket.on('chat:count', (count: number) => {
      markConnected();
      setChatMessageCount(count);
    });

    // New trading signal from ws-service
    socket.on('signal:new', (signal: TradingSignal) => {
      markConnected();
      setNotifications(prev => prev + 1);
      addChatMessage({
        id: `sig-${Date.now()}`,
        userId: 'system',
        username: 'Signal Bot',
        avatar: null,
        role: 'system',
        content: `New signal: ${signal.pair} ${signal.direction} @ ${signal.entryPrice} (Confidence: ${signal.confidence}%)`,
        channelId: 'signals',
        createdAt: new Date().toISOString(),
      });
    });

    // Economic event from ws-service
    socket.on('market:event', (event: Record<string, unknown>) => {
      markConnected();
      const title = event.title as string || 'Market Event';
      const currency = event.currency as string || '';
      const actual = event.actual as string || '';
      const forecast = event.forecast as string || '';
      addChatMessage({
        id: `event-${Date.now()}`,
        userId: 'system',
        username: 'News Bot',
        avatar: null,
        role: 'system',
        content: `[${currency}] ${title} - Actual: ${actual || 'pending'} | Forecast: ${forecast || '-'}`,
        channelId: 'general',
        createdAt: new Date().toISOString(),
      });
    });

    // Welcome event
    socket.on('welcome', (data: { connections: number }) => {
      markConnected();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [setLivePrices, addChatMessage, setChatMessageCount, setSocketConnected, setNotifications]);

  const sendChatMessage = (msg: {
    userId: string;
    username: string;
    role: string;
    content: string;
    channelId: string;
  }) => {
    socketRef.current?.emit('chat:message', msg);
  };

  return { sendChatMessage };
}
