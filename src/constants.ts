import { TechnicalParams, RiskParams, SystemStatus } from './types';

export const DEFAULT_TECHNICAL_PARAMS: TechnicalParams = {
  maShort: 20,
  maLong: 100,
  fibLevels: [0.236, 0.382, 0.618],
  breakoutThreshold: 24.01,
  volumeThresholdMult: 1.0, // Standard rule is > avg
};

export const DEFAULT_RISK_PARAMS: RiskParams = {
  stopLossMin: -5,
  stopLossMax: -10,
  bepActivationGain: 24.01,
};

export const MONTHLY_TARGET_IDR = 2500000;
export const JUNE_2026_DEADLINE = "2026-06-30";
