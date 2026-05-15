import { TechnicalParams, RiskParams } from '../types';
import { DEFAULT_TECHNICAL_PARAMS, DEFAULT_RISK_PARAMS } from '../constants';

let currentTechParams = { ...DEFAULT_TECHNICAL_PARAMS };
let currentRiskParams = { ...DEFAULT_RISK_PARAMS };

export const getTechParams = () => currentTechParams;
export const updateTechParams = (params: Partial<TechnicalParams>) => {
  currentTechParams = { ...currentTechParams, ...params };
  return currentTechParams;
};

export const getRiskParams = () => currentRiskParams;
export const updateRiskParams = (params: Partial<RiskParams>) => {
  currentRiskParams = { ...currentRiskParams, ...params };
  return currentRiskParams;
};
