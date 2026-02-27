import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, TrendingDown, Activity, Shield, PieChart, 
  Terminal, RefreshCw, AlertCircle, BarChart3, Layers
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { fetchNews, fetchSentiment, fetchMarketData } from './services/api';
import { computePriceSignal, computeVolumeSignal, computeBaseComposite } from './logic/signalEngine';
import { classifyMarketRegime, classifySectorRegime, applyMacroAdjustment, applySectorAdjustment } from './logic/riskEngine';
import { simulatePortfolio, getFinalDecision } from './logic/portfolioEngine';
import { SignalState, PortfolioState, MarketData } from './types';
import { motion, AnimatePresence } from 'motion/react';

const REFRESH_INTERVAL = 15000;

export default function App() {
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [marketData, setMarketData] = useState<{ stock: MarketData; nifty: MarketData; sector: MarketData } | null>(null);
  const [signal, setSignal] = useState<SignalState | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioState | null>(null);

  const updateIntelligence = useCallback(async () => {
    setLoading(true);
    try {
      // Layer 1: Data Acquisition
      const [headlines, stockData, niftyData, sectorData] = await Promise.all([
        fetchNews(),
        fetchMarketData("RELIANCE"),
        fetchMarketData("NIFTY"),
        fetchMarketData("IT_SECTOR")
      ]);

      setMarketData({ stock: stockData, nifty: niftyData, sector: sectorData });

      // Layer 1: Stock Intelligence
      const sentiment = await fetchSentiment(headlines);
      const priceSignal = computePriceSignal(stockData);
      const volumeSignal = computeVolumeSignal(stockData.volume);

      // Layer 2: Composite Score
      const baseComposite = computeBaseComposite(sentiment, priceSignal, volumeSignal);

      // Layer 3: Macro Regime
      const macroRegime = classifyMarketRegime(niftyData.change_percent);
      
      // Layer 4: Sector Regime
      const sectorRegime = classifySectorRegime(sectorData.change_percent);

      // Layer 5: Final Decision Engine (Adjustments)
      let currentConfidence = Math.abs(baseComposite) * 100;
      let currentAllocation = 50; // Base allocation
      let reasoning: string[] = [
        `Sentiment detected: ${sentiment.toFixed(2)}`,
        `Price signal computed: ${priceSignal.toFixed(2)}`,
        `Volume signal: ${volumeSignal.toFixed(2)}`,
        `Base composite formed: ${baseComposite.toFixed(2)}`
      ];

      // Apply Macro
      const macroAdj = applyMacroAdjustment(baseComposite, currentConfidence, currentAllocation, macroRegime);
      currentConfidence = macroAdj.adjConfidence;
      currentAllocation = macroAdj.adjAllocation;
      reasoning = [...reasoning, ...macroAdj.logs];

      // Apply Sector
      const sectorAdj = applySectorAdjustment(baseComposite, currentConfidence, currentAllocation, sectorRegime);
      const finalComposite = sectorAdj.adjComposite;
      currentConfidence = sectorAdj.adjConfidence;
      currentAllocation = sectorAdj.adjAllocation;
      reasoning = [...reasoning, ...sectorAdj.logs];

      const decision = getFinalDecision(finalComposite);
      reasoning.push(`Final decision generated: ${decision}`);

      setSignal({
        sentiment,
        price_signal: priceSignal,
        volume_signal: volumeSignal,
        base_composite: baseComposite,
        macro_regime: macroRegime,
        sector_regime: sectorRegime,
        adjusted_composite: finalComposite,
        confidence: currentConfidence,
        allocation: currentAllocation,
        decision,
        reasoning_log: reasoning
      });

      setPortfolio(simulatePortfolio(decision, currentAllocation));
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Update Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    updateIntelligence();
    const interval = setInterval(updateIntelligence, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [updateIntelligence]);

  if (!marketData || !signal || !portfolio) {
    return (
      <div className="min-h-screen bg-[#050505] text-emerald-500 font-mono flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin w-8 h-8" />
          <p className="text-sm tracking-widest uppercase">Initializing QuantIntel Terminal...</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score > 0.2) return 'text-emerald-400';
    if (score < -0.2) return 'text-rose-400';
    return 'text-amber-400';
  };

  const getRegimeColor = (regime: string) => {
    if (regime === 'BULLISH' || regime === 'STRONG') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    if (regime === 'BEARISH' || regime === 'WEAK') return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
    return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
  };

  const chartData = [
    { name: 'Sentiment', val: signal.sentiment },
    { name: 'Price', val: signal.price_signal },
    { name: 'Volume', val: signal.volume_signal },
    { name: 'Base', val: signal.base_composite },
    { name: 'Final', val: signal.adjusted_composite },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-emerald-500 font-mono p-4 selection:bg-emerald-500/30">
      {/* Top Ticker Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 border-b border-emerald-900/30 pb-4">
        <div className="flex items-center gap-3 bg-[#0a0a0a] p-3 border border-emerald-900/20 rounded">
          <Activity className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-[10px] uppercase opacity-50">NIFTY 50 INDEX</p>
            <p className="text-lg font-bold">
              {marketData.nifty.last_price.toLocaleString()} 
              <span className={`ml-2 text-xs ${marketData.nifty.change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {marketData.nifty.change_percent >= 0 ? '+' : ''}{marketData.nifty.change_percent.toFixed(2)}%
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-[#0a0a0a] p-3 border border-emerald-900/20 rounded">
          <Layers className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-[10px] uppercase opacity-50">SECTOR: IT_SECTOR</p>
            <p className="text-lg font-bold">
              {marketData.sector.last_price.toLocaleString()}
              <span className={`ml-2 text-xs ${marketData.sector.change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {marketData.sector.change_percent >= 0 ? '+' : ''}{marketData.sector.change_percent.toFixed(2)}%
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between bg-[#0a0a0a] p-3 border border-emerald-900/20 rounded">
          <div>
            <p className="text-[10px] uppercase opacity-50">LAST REFRESH</p>
            <p className="text-xs">{lastUpdate.toLocaleTimeString()}</p>
          </div>
          {loading && <RefreshCw className="animate-spin w-4 h-4 opacity-50" />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Intelligence & Signals */}
        <div className="lg:col-span-8 space-y-6">
          {/* Signal Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0a0a0a] border border-emerald-900/20 p-5 rounded relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10"><BarChart3 size={64} /></div>
              <h3 className="text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <Terminal className="w-3 h-3" /> Layer 1: Signal Matrix
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs opacity-70">FinBERT Sentiment</span>
                  <span className={`text-sm font-bold ${getScoreColor(signal.sentiment)}`}>
                    {signal.sentiment.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs opacity-70">Price Momentum</span>
                  <span className={`text-sm font-bold ${getScoreColor(signal.price_signal)}`}>
                    {signal.price_signal.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs opacity-70">Volume Strength</span>
                  <span className={`text-sm font-bold ${getScoreColor(signal.volume_signal)}`}>
                    {signal.volume_signal.toFixed(3)}
                  </span>
                </div>
                <div className="pt-4 border-t border-emerald-900/20 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase">Base Composite</span>
                  <span className={`text-lg font-bold ${getScoreColor(signal.base_composite)}`}>
                    {signal.base_composite.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-emerald-900/20 p-5 rounded">
              <h3 className="text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <Shield className="w-3 h-3" /> Risk Regimes
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] uppercase opacity-50 mb-2">Macro Regime (NIFTY)</p>
                  <div className={`text-center py-2 border rounded text-xs font-bold ${getRegimeColor(signal.macro_regime)}`}>
                    {signal.macro_regime}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase opacity-50 mb-2">Sector Regime (IT)</p>
                  <div className={`text-center py-2 border rounded text-xs font-bold ${getRegimeColor(signal.sector_regime)}`}>
                    {signal.sector_regime}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Signal Chart */}
          <div className="bg-[#0a0a0a] border border-emerald-900/20 p-5 rounded h-64">
            <h3 className="text-xs uppercase tracking-widest mb-4">Signal Components Visualization</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" vertical={false} />
                <XAxis dataKey="name" stroke="#059669" fontSize={10} />
                <YAxis stroke="#059669" fontSize={10} domain={[-1, 1]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #064e3b', fontSize: '12px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Bar dataKey="val">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.val >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Reasoning Log */}
          <div className="bg-[#0a0a0a] border border-emerald-900/20 p-5 rounded">
            <h3 className="text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <Terminal className="w-3 h-3" /> AI Reasoning Log
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-900">
              <AnimatePresence mode="popLayout">
                {signal.reasoning_log.map((log, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[11px] flex gap-3 border-l-2 border-emerald-900/50 pl-3 py-1"
                  >
                    <span className="opacity-30">[{i.toString().padStart(2, '0')}]</span>
                    <span className="opacity-80">{log}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: Final Decision & Portfolio */}
        <div className="lg:col-span-4 space-y-6">
          {/* Decision Engine */}
          <div className="bg-[#0a0a0a] border border-emerald-900/20 p-6 rounded text-center">
            <h3 className="text-xs uppercase tracking-widest mb-6">Final Decision Engine</h3>
            <div className={`text-3xl font-black uppercase mb-2 ${getScoreColor(signal.adjusted_composite)}`}>
              {signal.decision}
            </div>
            <div className="flex justify-center items-center gap-2 mb-6">
              <span className="text-[10px] opacity-50 uppercase">Confidence</span>
              <span className="text-sm font-bold">{signal.confidence.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-emerald-900/20 h-1 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${signal.confidence}%` }}
              />
            </div>
          </div>

          {/* Portfolio Breakdown */}
          <div className="bg-[#0a0a0a] border border-emerald-900/20 p-6 rounded">
            <h3 className="text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
              <PieChart className="w-3 h-3" /> Portfolio Simulation
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] opacity-50 uppercase">Equity Allocation</p>
                  <p className="text-2xl font-bold">{portfolio.equity_percent}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] opacity-50 uppercase">Cash Reserve</p>
                  <p className="text-lg opacity-80">{(100 - portfolio.equity_percent).toFixed(0)}%</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="opacity-70">Equity Value</span>
                  <span>${portfolio.equity_value.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="opacity-70">Cash Value</span>
                  <span>${portfolio.cash_value.toLocaleString()}</span>
                </div>
                <div className="pt-3 border-t border-emerald-900/20 flex justify-between text-sm font-bold">
                  <span className="uppercase tracking-widest">Total Capital</span>
                  <span>${portfolio.total_value.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Alert */}
          {signal.adjusted_composite < -0.3 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-rose-500/10 border border-rose-500/50 p-4 rounded flex gap-3 items-start"
            >
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-rose-400 uppercase mb-1">Risk Warning</p>
                <p className="text-[10px] text-rose-300 leading-relaxed">
                  High negative composite detected. Macro/Sector regimes indicate significant downside risk. Consider immediate hedging or capital reduction.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-emerald-900/30 flex justify-between items-center text-[10px] opacity-40 uppercase tracking-[0.2em]">
        <span>QuantIntel Terminal v2.0.4</span>
        <span>Institutional Grade • Real-time Inference</span>
      </div>
    </div>
  );
}
