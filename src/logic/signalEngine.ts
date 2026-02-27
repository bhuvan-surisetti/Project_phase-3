import { MarketData } from "../types";

export function computePriceSignal(data: MarketData): number {
  // Normalize percent change to range -1 to +1
  // Assuming +/- 5% is the max normal range for normalization
  const signal = data.change_percent / 5;
  return Math.max(-1, Math.min(1, signal));
}

export function computeVolumeSignal(volume: number): number {
  // Simple threshold logic: > 1M is strong, < 500k is weak
  if (volume > 1000000) return 0.8;
  if (volume > 750000) return 0.4;
  if (volume < 500000) return -0.4;
  return 0.1;
}

export function computeBaseComposite(sentiment: number, priceSignal: number, volumeSignal: number): number {
  // Formula: 0.4 × Sentiment + 0.4 × Price Signal + 0.2 × Volume Signal
  const score = (0.4 * sentiment) + (0.4 * priceSignal) + (0.2 * volumeSignal);
  return Math.max(-1, Math.min(1, score));
}
