export interface MarketData {
  last_price: number;
  previous_close: number;
  volume: number;
  change_percent: number;
}

export interface SignalState {
  sentiment: number;
  price_signal: number;
  volume_signal: number;
  base_composite: number;
  macro_regime: "BULLISH" | "BEARISH" | "NEUTRAL";
  sector_regime: "STRONG" | "WEAK" | "NEUTRAL";
  adjusted_composite: number;
  confidence: number;
  allocation: number;
  decision: "Strong Buy" | "Buy" | "Hold" | "Reduce" | "Strong Sell";
  reasoning_log: string[];
}

export interface PortfolioState {
  equity_percent: number;
  equity_value: number;
  cash_value: number;
  total_value: number;
}
