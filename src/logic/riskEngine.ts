export function classifyMarketRegime(indexChangePercent: number): "BULLISH" | "BEARISH" | "NEUTRAL" {
  if (indexChangePercent > 0.5) return "BULLISH";
  if (indexChangePercent < -0.5) return "BEARISH";
  return "NEUTRAL";
}

export function classifySectorRegime(sectorChangePercent: number): "STRONG" | "WEAK" | "NEUTRAL" {
  if (sectorChangePercent > 1.0) return "STRONG";
  if (sectorChangePercent < -1.0) return "WEAK";
  return "NEUTRAL";
}

export function applyMacroAdjustment(
  compositeScore: number,
  confidence: number,
  allocation: number,
  regime: "BULLISH" | "BEARISH" | "NEUTRAL"
) {
  let adjConfidence = confidence;
  let adjAllocation = allocation;
  const logs: string[] = [];

  if (regime === "BEARISH") {
    adjConfidence *= 0.7; // reduce 30%
    adjAllocation *= 0.8; // reduce 20%
    logs.push("Macro Regime BEARISH: Reducing confidence by 30% and allocation by 20%");
  } else if (regime === "BULLISH") {
    adjConfidence *= 1.1; // increase 10%
    adjAllocation *= 1.1; // increase 10%
    logs.push("Macro Regime BULLISH: Boosting confidence and allocation by 10%");
  }

  return { adjConfidence, adjAllocation, logs };
}

export function applySectorAdjustment(
  compositeScore: number,
  confidence: number,
  allocation: number,
  sectorRegime: "STRONG" | "WEAK" | "NEUTRAL"
) {
  let adjComposite = compositeScore;
  let adjConfidence = confidence;
  let adjAllocation = allocation;
  const logs: string[] = [];

  if (sectorRegime === "WEAK") {
    adjComposite -= 0.1;
    adjConfidence *= 0.8; // reduce 20%
    adjAllocation *= 0.85; // reduce 15%
    logs.push("Sector Regime WEAK: Dampening composite by 0.1, confidence by 20%, allocation by 15%");
  } else if (sectorRegime === "STRONG") {
    adjComposite += 0.1;
    adjConfidence *= 1.1; // increase 10%
    adjAllocation *= 1.1; // increase 10%
    logs.push("Sector Regime STRONG: Boosting composite by 0.1, confidence and allocation by 10%");
  }

  return { adjComposite, adjConfidence, adjAllocation, logs };
}
