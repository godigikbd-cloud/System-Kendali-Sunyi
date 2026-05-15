/**
 * Sistem Kendali Sunyi - Types
 */

export enum SystemStatus {
  STANDBY = "STANDBY",
  ACTIVE = "ACTIVE MONITORING",
  EMERGENCY = "EMERGENCY / DARURAT",
}

export interface TechnicalParams {
  maShort: number;
  maLong: number;
  fibLevels: number[];
  breakoutThreshold: number; // e.g., 24.01
  volumeThresholdMult: number; // e.g., 1.5x avg
}

export interface RiskParams {
  stopLossMin: number; // e.g., -5%
  stopLossMax: number; // e.g., -10%
  bepActivationGain: number; // e.g., 24.01%
}

export interface Portfolio {
  equity: number;
  cashRDN: number;
  cashCrypto: number;
  monthlyTarget: number; // IDR 2.500.000
  lastAccumulationDate: string;
}

export interface Asset {
  ticker: string;
  type: 'Stock' | 'Crypto';
  price: number;
  change24h: number;
  lastMA20: number;
  lastMA100: number;
  lastVolume: number;
  avgVolume20d: number;
}

export interface TradeRecord {
  id: string;
  ticker: string;
  entryPrice: number;
  amount: number;
  timestamp: string;
  type: 'BUY' | 'SELL';
  status: 'OPEN' | 'CLOSED';
}

export interface Report {
  id: string;
  date: string;
  status: SystemStatus;
  reason: string;
  equity: number;
  cashRDN: number;
  cashCrypto: number;
  targetStatus: string;
  instructions: string[];
}
