import { PortfolioState } from "../types";

export function simulatePortfolio(decision: string, adjustedAllocation: number): PortfolioState {
  const initialCapital = 100000;
  
  // Allocation is in percentage (e.g. 60)
  const equityPercent = Math.max(20, Math.min(95, adjustedAllocation));
  const equityValue = initialCapital * (equityPercent / 100);
  const cashValue = initialCapital - equityValue;

  return {
    equity_percent: equityPercent,
    equity_value: equityValue,
    cash_value: cashValue,
    total_value: initialCapital
  };
}

export function getFinalDecision(composite: number): "Strong Buy" | "Buy" | "Hold" | "Reduce" | "Strong Sell" {
  if (composite >= 0.5) return "Strong Buy";
  if (composite >= 0.1) return "Buy";
  if (composite >= -0.1) return "Hold";
  if (composite >= -0.5) return "Reduce";
  return "Strong Sell";
}
