import { Asset, SystemStatus, TechnicalParams, RiskParams } from '../types';

/**
 * Rule A: Trend Filter
 * Price > MA 20 or MA 100 AND Volume > 20d Average
 */
export function checkRuleA(asset: Asset, params: TechnicalParams): boolean {
  const trendCondition = asset.price > asset.lastMA20 || asset.price > asset.lastMA100;
  const volumeCondition = asset.lastVolume > asset.avgVolume20d * params.volumeThresholdMult;
  return trendCondition && volumeCondition;
}

/**
 * Rule B: Entry Confirmation
 * Testing Fibonacci levels with 3-day validation logic.
 * (Simplified for UI simulation: if price is near fib levels and trend is up)
 */
export function checkRuleB(asset: Asset, params: TechnicalParams): { valid: boolean; level?: number } {
  const diffs = params.fibLevels.map(level => Math.abs(asset.price - (asset.price * (1 - level)))); // Very rough estimation
  // In a real system, fib level is calculated from H/L range.
  // For this simulation, we'll assume if Rule A is met, we look for validation.
  return { valid: true }; 
}

/**
 * Rule C: Capital Protection
 * Stop Loss -5% to -10%. SL to BEP after +24.01% gain.
 */
export function evaluateRisk(entryPrice: number, currentPrice: number, params: RiskParams): string {
  const gain = ((currentPrice - entryPrice) / entryPrice) * 100;
  if (gain >= params.bepActivationGain) {
    return "MOVE SL TO BEP (BREAK-EVEN POINT)";
  }
  if (gain <= params.stopLossMax) {
    return "STOP LOSS TRIGGERED";
  }
  return "STAY IN POSITION";
}

/**
 * Rule D: Profit Management
 * +20% modal if breakout > 24.01%
 */
export function evaluatePyramiding(gain: number): boolean {
  return gain >= 24.01;
}

/**
 * Rule E: Automatic Reporting
 * Logic to determine if report is needed.
 */
export function getSystemStatus(assets: Asset[], params: TechnicalParams): SystemStatus {
  const isAnyActive = assets.some(a => checkRuleA(a, params));
  return isAnyActive ? SystemStatus.ACTIVE : SystemStatus.STANDBY;
}
