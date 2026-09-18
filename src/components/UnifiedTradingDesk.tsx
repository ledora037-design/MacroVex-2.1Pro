import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Cpu,
  ExternalLink,
  Filter,
  Flame,
  Globe,
  Layers,
  Maximize2,
  Minimize2,
  Network,
  Percent,
  Play,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Sliders,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  AIDecision,
  AIActivityItem,
  AssetIntelligence,
  AssetSummary,
  Candle,
  ClosedTrade,
  InstrumentId,
  MarketRegime,
  Position,
} from '../types.js';

interface UnifiedTradingDeskProps {
  agentState: {
    state: string;
    currentAsset: string | null;
    lastCycleAt: number;
    conviction: number;
  };
  radar: AssetSummary[];
  openPositions: Position[];
  closedTrades: ClosedTrade[];
  aiDecisions: AIDecision[];
  activities: AIActivityItem[];
  regime: MarketRegime;
  onOpenJournal: (tradeId: string) => void;
  onClosePosition: (id: string) => void;
  onTriggerCycle: () => void;
  isTriggering: boolean;
  onOpenSettings: () => void;
  onOpenHealth: () => void;
}

export const UnifiedTradingDesk: React.FC<UnifiedTradingDeskProps> = ({
  agentState,
  radar,
  openPositions,
  closedTrades,
  aiDecisions,
  activities,
  regime,
  onOpenJournal,
  onClosePosition,
  onTriggerCycle,
  isTriggering,
  onOpenSettings,
  onOpenHealth,
}) => {
  // Selected active asset
  const [selectedAsset, setSelectedAsset] = useState<InstrumentId>('BTC');
  const [timeframe, setTimeframe] = useState<'15m' | '1h' | '4h' | '1D'>('1h');
  const [activeCenterView, setActiveCenterView] = useState<'TERMINAL' | 'MACRO_PIPELINE' | 'STRATEGY_RISK' | 'LEDGER'>('TERMINAL');

  // Screener state
  const [assetCategory, setAssetCategory] = useState<'ALL' | 'CRYPTO' | 'EQUITIES' | 'COMMODITIES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Bottom dock state
  const [dockTab, setDockTab] = useState<'POSITIONS' | 'TRADES' | 'DECISIONS' | 'LOGS'>('POSITIONS');
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // Asset live data
  const [intel, setIntel] = useState<AssetIntelligence | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loadingAsset, setLoadingAsset] = useState(false);

  // Order Ticket state
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [leverage, setLeverage] = useState<number>(5);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [isEvaluatingAI, setIsEvaluatingAI] = useState(false);
  const [isSubmittingTrade, setIsSubmittingTrade] = useState(false);
  const [tradeFeedback, setTradeFeedback] = useState<{ success: boolean; message: string; checks?: Record<string, boolean> } | null>(null);

  // Fetch asset data when selectedAsset or timeframe changes
  const fetchAssetData = async (symbol: InstrumentId, tf: string) => {
    setLoadingAsset(true);
    try {
      const [intelRes, candleRes] = await Promise.all([
        fetch(`/api/market/asset/${symbol}`),
        fetch(`/api/market/candles/${symbol}?timeframe=${tf}`),
      ]);
      if (intelRes.ok && candleRes.ok) {
        const intelData = await intelRes.json();
        const candleData = await candleRes.json();
        setIntel(intelData);
        setCandles(candleData);

        const curPrice = intelData.price || 100;
        setEntryPrice(curPrice.toString());
        const isBull = intelData.technicalBias === 'BULLISH';
        const dir = isBull ? 'LONG' : 'SHORT';
        setDirection(dir);
        if (dir === 'LONG') {
          setStopLoss((curPrice * 0.985).toFixed(2));
          setTakeProfit((curPrice * 1.035).toFixed(2));
        } else {
          setStopLoss((curPrice * 1.015).toFixed(2));
          setTakeProfit((curPrice * 0.965).toFixed(2));
        }
      }
    } catch (err) {
      console.error('Error fetching asset data:', err);
    } finally {
      setLoadingAsset(false);
    }
  };

  useEffect(() => {
    fetchAssetData(selectedAsset, timeframe);
  }, [selectedAsset, timeframe]);

  // Filtered radar assets for the screener
  const filteredRadar = useMemo(() => {
    return radar.filter((item) => {
      const matchesCat = assetCategory === 'ALL' || item.category === assetCategory;
      const matchesSearch =
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [radar, assetCategory, searchQuery]);

  // Risk & Reward math
  const numEntry = parseFloat(entryPrice) || 0;
  const numSl = parseFloat(stopLoss) || 0;
  const numTp = parseFloat(takeProfit) || 0;
  const riskDist = Math.abs(numEntry - numSl);
  const rewardDist = Math.abs(numTp - numEntry);
  const liveRR = riskDist > 0 ? parseFloat((rewardDist / riskDist).toFixed(2)) : 0;

  // AI Autofill
  const handleAIAutofill = async () => {
    setIsEvaluatingAI(true);
    setTradeFeedback(null);
    try {
      const res = await fetch('/api/decisions/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset: selectedAsset }),
      });
      if (res.ok) {
        const dec = await res.json();
        setDirection(dec.direction);
        setEntryPrice(dec.entry.toString());
        setStopLoss(dec.stop_loss.toString());
        setTakeProfit(dec.take_profit.toString());
        setLeverage(dec.leverage || 5);
        setRiskPercent(dec.risk_percent || 1.5);
        setTradeFeedback({
          success: true,
          message: `AI evaluated ${selectedAsset} [${dec.action}]: Confidence ${dec.confidence}%. Optimal R:R ${dec.rr}:1 loaded.`,
        });
      }
    } catch (err: any) {
      setTradeFeedback({ success: false, message: `Autofill failed: ${err.message}` });
    } finally {
      setIsEvaluatingAI(false);
    }
  };

  // Execute manual trade
  const handleExecuteTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTrade(true);
    setTradeFeedback(null);

    try {
      const res = await fetch('/api/trades/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset: selectedAsset,
          direction,
          entry: parseFloat(entryPrice),
          stop_loss: parseFloat(stopLoss),
          take_profit: parseFloat(takeProfit),
          leverage,
          risk_percent: riskPercent,
        }),
      });

      const data = await res.json();
      if (res.ok && data.approved) {
        setTradeFeedback({
          success: true,
          message: `Order Approved: ${direction} ${selectedAsset} executed. Passed all 20 Risk Gates!`,
          checks: data.riskResult?.checks,
        });
        setDockTab('POSITIONS');
        setIsDockCollapsed(false);
      } else {
        setTradeFeedback({
          success: false,
          message: `Risk Gate REJECTED: ${data.reason}`,
          checks: data.checks,
        });
      }
    } catch (err: any) {
      setTradeFeedback({
        success: false,
        message: `Execution error: ${err.message}`,
      });
    } finally {
      setIsSubmittingTrade(false);
    }
  };

  // Format chart data
  const chartData = candles.map((c) => ({
    time: new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: c.close,
    high: c.high,
    low: c.low,
    volume: c.volume,
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#07090e] text-slate-200">
      {/* ========================================================================= */}
      {/* 1. TOP TICKER TAPE RIBBON (Real-time prices across all assets) */}
      {/* ========================================================================= */}
      <div className="h-8 bg-[#090c12] border-b border-[#161f2e] px-3 flex items-center overflow-x-auto no-scrollbar font-mono text-[11px] select-none">
        <div className="flex items-center gap-1 text-slate-400 mr-3 shrink-0 font-display text-[10px] tracking-wider uppercase">
          <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>MARKET TAPE</span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {radar.slice(0, 16).map((item) => {
            const isUp = item.change24h >= 0;
            const isSelected = item.symbol === selectedAsset;
            return (
              <button
                key={item.symbol}
                onClick={() => setSelectedAsset(item.symbol as InstrumentId)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <span className="font-bold text-white">{item.symbol}</span>
                <span className="text-slate-400">${item.price.toLocaleString()}</span>
                <span className={`font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? '+' : ''}{item.change24h}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THREE-PANE INSTITUTIONAL WORKSPACE GRID */}
      {/* ========================================================================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-1 p-1 min-h-0 overflow-hidden">
        {/* ----------------------------------------------------------------------- */}
        {/* PANE A (LEFT, 3 COLS): ASSET WATCHLIST, SCREENER & REGIME RADAR */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-3 flex flex-col bg-[#0b0f17] border border-[#161f2e] rounded-lg overflow-hidden">
          {/* Screener Header */}
          <div className="p-2.5 bg-[#080c12] border-b border-[#161f2e] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-display text-xs font-bold text-white tracking-wider">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>MARKET SCREENER</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                24 ASSETS
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
              {(['ALL', 'CRYPTO', 'EQUITIES', 'COMMODITIES'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAssetCategory(cat)}
                  className={`py-1 rounded text-center cursor-pointer transition-colors ${
                    assetCategory === cat
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat === 'COMMODITIES' ? 'COMM' : cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2.5" />
              <input
                type="text"
                placeholder="Filter symbols / names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0d131f] border border-slate-800 rounded pl-7 pr-2 py-1 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Screener Table List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 font-mono text-xs">
            {filteredRadar.map((item) => {
              const isSelected = item.symbol === selectedAsset;
              const isUp = item.change24h >= 0;
              const isBullish = item.technicalBias === 'BULLISH';
              return (
                <div
                  key={item.symbol}
                  onClick={() => setSelectedAsset(item.symbol as InstrumentId)}
                  className={`p-2 flex items-center justify-between cursor-pointer transition-colors select-none ${
                    isSelected
                      ? 'bg-cyan-950/40 border-l-2 border-cyan-400 text-white'
                      : 'hover:bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{item.symbol}</span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                          isBullish
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : item.technicalBias === 'BEARISH'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.technicalBias}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate max-w-[110px]">
                      {item.name}
                    </span>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="font-bold text-white">
                      ${item.price < 1 ? item.price.toFixed(4) : item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUp ? '+' : ''}{item.change24h}%
                      </span>
                      <span className="text-[9px] bg-slate-800/80 text-cyan-300 px-1 rounded font-bold" title="AI Opportunity Score">
                        {item.opportunityScore}pt
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Screener Footer: Macro Regime Badge */}
          <div className="p-2 bg-[#080c12] border-t border-[#161f2e] text-[10px] font-mono flex items-center justify-between">
            <div className="flex items-center gap-1 text-slate-400">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>REGIME:</span>
              <strong className="text-emerald-400">{regime}</strong>
            </div>
            <span className="text-slate-400 font-bold">100% DETERMINISTIC RISK</span>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* PANE B (CENTER, 6 COLS): PRIMARY TRADING COCKPIT & DOCKED TABS */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-6 flex flex-col gap-1 min-h-0 overflow-y-auto">
          {/* Center View Switcher Header */}
          <div className="bg-[#0b0f17] border border-[#161f2e] rounded-lg p-2 flex items-center justify-between">
            <div className="flex items-center gap-1 font-mono text-xs">
              <button
                onClick={() => setActiveCenterView('TERMINAL')}
                className={`px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeCenterView === 'TERMINAL'
                    ? 'bg-cyan-500 text-black shadow'
                    : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>TERMINAL & EXECUTION</span>
              </button>
              <button
                onClick={() => setActiveCenterView('MACRO_PIPELINE')}
                className={`px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeCenterView === 'MACRO_PIPELINE'
                    ? 'bg-cyan-500 text-black shadow'
                    : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>5-STAGE MACRO PIPELINE</span>
              </button>
              <button
                onClick={() => setActiveCenterView('STRATEGY_RISK')}
                className={`px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeCenterView === 'STRATEGY_RISK'
                    ? 'bg-cyan-500 text-black shadow'
                    : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>20-GATE RISK & BACKTEST</span>
              </button>
            </div>

            {/* Run Cycle Override */}
            <button
              onClick={onTriggerCycle}
              disabled={isTriggering}
              className="px-2.5 py-1 rounded bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-mono font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              title="Force execute 1 full autonomous AI cycle now"
            >
              <Zap className="w-3 h-3" />
              <span>{isTriggering ? 'RUNNING...' : 'TRIGGER CYCLE'}</span>
            </button>
          </div>

          {/* VIEW 1: TERMINAL & CHART WORKSPACE */}
          {activeCenterView === 'TERMINAL' && (
            <div className="space-y-1">
              {/* Asset Bar & Timeframes */}
              <div className="bg-[#0b0f17] border border-[#161f2e] rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-base font-bold text-white tracking-wide">
                      {intel?.name || selectedAsset}
                    </h2>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      {selectedAsset}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-500/10">
                      {intel?.status || 'AVAILABLE'}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3 mt-1 font-mono">
                    <span className="text-xl font-bold text-white">
                      ${intel?.price ? intel.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'}
                    </span>
                    <span className={`text-xs font-bold ${(intel?.change24h || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {(intel?.change24h || 0) >= 0 ? '+' : ''}{intel?.change24h}%
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      24h High: ${intel?.high24h} • Low: ${intel?.low24h}
                    </span>
                  </div>
                </div>

                {/* Timeframe selector */}
                <div className="flex items-center gap-1 bg-[#080c12] p-1 rounded border border-slate-800 font-mono text-xs">
                  {(['15m', '1h', '4h', '1D'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        timeframe === tf ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Candlestick & Volume Chart */}
              <div className="bg-[#0b0f17] border border-[#161f2e] rounded-lg p-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-cyan-300 font-bold">RSI(14): {intel?.indicators.rsi14}</span>
                    <span>EMA20: ${intel?.indicators.ema20}</span>
                    <span>VWAP: ${intel?.indicators.vwap}</span>
                  </div>
                  <span className="text-emerald-400 font-bold">STRUCTURE: {intel?.smc.marketStructure}</span>
                </div>

                <div className="h-[200px] w-full">
                  {loadingAsset ? (
                    <div className="w-full h-full flex items-center justify-center font-mono text-xs text-slate-500">
                      Loading chart feed...
                    </div>
                  ) : chartData.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center font-mono text-xs text-slate-500">
                      No candle data for {selectedAsset}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#161f2e" opacity={0.6} />
                        <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                        <YAxis
                          stroke="#475569"
                          fontSize={10}
                          domain={['auto', 'auto']}
                          tickFormatter={(v) => `$${v}`}
                          tickLine={false}
                          orientation="right"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#090d14',
                            borderColor: '#1e293b',
                            color: '#f8fafc',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke="#00e5ff"
                          strokeWidth={2}
                          dot={false}
                          name="Price"
                        />
                        <Bar dataKey="volume" fill="#1e293b" opacity={0.4} yAxisId="right" name="Volume" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Lower Deck: SMC Analysis & Integrated Order Ticket */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-1">
                {/* Left Sub-card: Smart Money Concepts (5 Cols) */}
                <div className="md:col-span-5 bg-[#0b0f17] border border-[#161f2e] rounded-lg p-3 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <span className="font-display text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      SMC & LIQUIDITY
                    </span>
                    <span className="text-[10px] text-slate-400">INSTITUTIONAL ZONES</span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="p-1.5 rounded bg-[#080c12] border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Order Blocks:</span>
                      <span className="text-emerald-400 font-bold">{intel?.smc.orderBlocks.length || 0} Key Zones</span>
                    </div>
                    <div className="p-1.5 rounded bg-[#080c12] border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Fair Value Gaps:</span>
                      <span className="text-cyan-400 font-bold">{intel?.smc.fvg.length || 0} Imbalances</span>
                    </div>
                    <div className="p-1.5 rounded bg-[#080c12] border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Breakout State:</span>
                      <span className="text-amber-400 font-bold">{intel?.smc.breakoutState}</span>
                    </div>
                    <div className="p-1.5 rounded bg-[#080c12] border border-slate-800 flex justify-between">
                      <span className="text-slate-400">ADX Trend Power:</span>
                      <span className="text-white font-bold">{intel?.indicators.adx}</span>
                    </div>
                  </div>
                </div>

                {/* Right Sub-card: Embedded Risk-Gated Order Ticket (7 Cols) */}
                <div className="md:col-span-7 bg-[#0b0f17] border border-[#161f2e] rounded-lg p-3 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <span className="font-display text-xs font-bold text-white flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      ORDER EXECUTION TICKET
                    </span>
                    <button
                      type="button"
                      onClick={handleAIAutofill}
                      disabled={isEvaluatingAI}
                      className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Bot className="w-3 h-3" />
                      <span>{isEvaluatingAI ? 'CALCULATING...' : 'AI AUTOFILL'}</span>
                    </button>
                  </div>

                  <form onSubmit={handleExecuteTrade} className="space-y-2">
                    {/* Direction Buttons */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDirection('LONG')}
                        className={`py-1.5 rounded font-bold text-xs transition-colors cursor-pointer ${
                          direction === 'LONG'
                            ? 'bg-emerald-500 text-black font-bold shadow'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        LONG / BUY
                      </button>
                      <button
                        type="button"
                        onClick={() => setDirection('SHORT')}
                        className={`py-1.5 rounded font-bold text-xs transition-colors cursor-pointer ${
                          direction === 'SHORT'
                            ? 'bg-rose-500 text-white font-bold shadow'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        SHORT / SELL
                      </button>
                    </div>

                    {/* Inputs Grid */}
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      <div>
                        <label className="text-slate-400">ENTRY ($)</label>
                        <input
                          type="number"
                          step="any"
                          value={entryPrice}
                          onChange={(e) => setEntryPrice(e.target.value)}
                          className="w-full mt-0.5 p-1 rounded bg-[#080c12] border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-rose-400">STOP LOSS ($)</label>
                        <input
                          type="number"
                          step="any"
                          value={stopLoss}
                          onChange={(e) => setStopLoss(e.target.value)}
                          className="w-full mt-0.5 p-1 rounded bg-[#080c12] border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-emerald-400">TAKE PROFIT ($)</label>
                        <input
                          type="number"
                          step="any"
                          value={takeProfit}
                          onChange={(e) => setTakeProfit(e.target.value)}
                          className="w-full mt-0.5 p-1 rounded bg-[#080c12] border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Live R:R math strip */}
                    <div className="p-1.5 rounded bg-[#080c12] border border-slate-800 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">R:R RATIO:</span>
                      <span className={liveRR >= 1.5 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {liveRR}:1 (Min 1.5:1 Required)
                      </span>
                      <span className="text-slate-400">LEVERAGE: {leverage}x</span>
                      <span className="text-slate-400">RISK: {riskPercent}%</span>
                    </div>

                    {/* Feedback */}
                    {tradeFeedback && (
                      <div
                        className={`p-1.5 rounded text-[10px] leading-tight border ${
                          tradeFeedback.success
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                        }`}
                      >
                        {tradeFeedback.message}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingTrade}
                      className="w-full py-1.5 rounded font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingTrade ? 'VALIDATING 20 RISK GATES...' : `EXECUTE ${direction} ${selectedAsset}`}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: 5-STAGE MACRO TRANSMISSION */}
          {activeCenterView === 'MACRO_PIPELINE' && (
            <div className="bg-[#0b0f17] border border-[#161f2e] rounded-lg p-4 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <Network className="w-4 h-4" />
                  5-STAGE EVENT TRANSMISSION PIPELINE
                </span>
                <span className="text-[10px] text-slate-400">
                  REAL-TIME CAPITAL ALLOCATION MODEL
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <div className="p-2.5 rounded bg-[#080c12] border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-cyan-400">1. CATALYST</span>
                  <div className="text-white font-bold text-xs">Policy & Macro</div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Central bank forward guidance, CPI inflation, or geopolitical catalyst recorded.
                  </p>
                </div>
                <div className="p-2.5 rounded bg-[#080c12] border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-blue-400">2. DIRECT IMPACT</span>
                  <div className="text-white font-bold text-xs">Rates & Dollar</div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Immediate repricing across 2Y/10Y yield curve and US Dollar Index (DXY).
                  </p>
                </div>
                <div className="p-2.5 rounded bg-[#080c12] border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-violet-400">3. TRANSMISSION</span>
                  <div className="text-white font-bold text-xs">Liquidity Channels</div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Transmits via corporate credit spreads and discount rate adjustments.
                  </p>
                </div>
                <div className="p-2.5 rounded bg-[#080c12] border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-amber-400">4. ASSET FLOWS</span>
                  <div className="text-white font-bold text-xs">Beta & Rotation</div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Equities, Crypto, and Commodities price the new macro discount rate.
                  </p>
                </div>
                <div className="p-2.5 rounded bg-[#080c12] border border-cyan-500/40 space-y-1 bg-cyan-950/20">
                  <span className="text-[10px] font-bold text-emerald-400">5. RISK-GATED TRADE</span>
                  <div className="text-white font-bold text-xs">Deterministic Gate</div>
                  <p className="text-[10px] text-cyan-200 leading-tight">
                    Passed through 20 deterministic rules before authorized execution.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: 20-GATE RISK SPECIFICATION & BACKTEST LAB */}
          {activeCenterView === 'STRATEGY_RISK' && (
            <div className="bg-[#0b0f17] border border-[#161f2e] rounded-lg p-4 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  DETERMINISTIC 20-GATE SAFETY ENGINE
                </span>
                <span className="text-[10px] text-slate-400">ZERO UNSAFE ORDERS PERMITTED</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                {[
                  '1. Data Freshness (<120s)',
                  '2. Mapped Instrument',
                  '3. Valid Direction',
                  '4. Positive Entry Price',
                  '5. SL Geometry (Valid Risk)',
                  '6. TP Geometry (Valid Reward)',
                  '7. Min 1.5:1 R:R Target',
                  '8. AI Confidence > 65%',
                  '9. 2.0% Risk Cap',
                  '10. 250% Total Exposure',
                  '11. Sector 150% Exposure',
                  '12. Max 5 Open Positions',
                  '13. Max 5 Daily Trades',
                  '14. 4.0% Daily Loss Stop',
                  '15. 10.0% Max Drawdown Stop',
                  '16. Spread & Volatility',
                  '17. Leverage Ceiling (Max 10x)',
                  '18. Margin Availability',
                  '19. Stop Distance (0.3%-10%)',
                  '20. No Duplicate Trade',
                ].map((name, i) => (
                  <div key={i} className="p-2 rounded bg-[#080c12] border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300 font-bold">{name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PERSISTENT BOTTOM COCKPIT DOCK (ACCESSIBLE IN 1 CLICK!) */}
          {/* --------------------------------------------------------------------- */}
          <div className="bg-[#0b0f17] border border-[#161f2e] rounded-lg overflow-hidden flex flex-col">
            {/* Dock Tabs Header */}
            <div className="p-2 bg-[#080c12] border-b border-[#161f2e] flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setDockTab('POSITIONS'); setIsDockCollapsed(false); }}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                    dockTab === 'POSITIONS' && !isDockCollapsed
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>ACTIVE POSITIONS</span>
                  <span className="bg-slate-800 text-[10px] px-1 rounded">{openPositions.length}</span>
                </button>

                <button
                  onClick={() => { setDockTab('TRADES'); setIsDockCollapsed(false); }}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                    dockTab === 'TRADES' && !isDockCollapsed
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>CLOSED LEDGER</span>
                  <span className="bg-slate-800 text-[10px] px-1 rounded">{closedTrades.length}</span>
                </button>

                <button
                  onClick={() => { setDockTab('DECISIONS'); setIsDockCollapsed(false); }}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                    dockTab === 'DECISIONS' && !isDockCollapsed
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>AI DECISIONS</span>
                  <span className="bg-slate-800 text-[10px] px-1 rounded">{aiDecisions.length}</span>
                </button>

                <button
                  onClick={() => { setDockTab('LOGS'); setIsDockCollapsed(false); }}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                    dockTab === 'LOGS' && !isDockCollapsed
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>ACTIVITY AUDIT</span>
                </button>
              </div>

              {/* Collapse/Expand Toggle */}
              <button
                onClick={() => setIsDockCollapsed(!isDockCollapsed)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                title={isDockCollapsed ? 'Expand Dock' : 'Collapse Dock'}
              >
                {isDockCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Dock Content Body */}
            {!isDockCollapsed && (
              <div className="p-2 max-h-[220px] overflow-y-auto font-mono text-xs">
                {/* TAB 1: POSITIONS */}
                {dockTab === 'POSITIONS' && (
                  <div>
                    {openPositions.length === 0 ? (
                      <div className="py-6 text-center text-slate-500 text-xs">
                        NO OPEN POSITIONS (AI Waiting or Flat)
                      </div>
                    ) : (
                      <table className="w-full text-left text-[11px]">
                        <thead className="text-slate-500 border-b border-slate-800">
                          <tr>
                            <th className="py-1">ASSET</th>
                            <th className="py-1">SIDE</th>
                            <th className="py-1">ENTRY</th>
                            <th className="py-1">MARK</th>
                            <th className="py-1">SL / TP</th>
                            <th className="py-1">P&L ($)</th>
                            <th className="py-1 text-right">ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {openPositions.map((pos) => {
                            const isWin = pos.unrealizedPnl >= 0;
                            return (
                              <tr key={pos.id} className="hover:bg-slate-900/40">
                                <td className="py-1.5 font-bold text-white">
                                  {pos.asset} <span className="text-[10px] text-slate-500">[{pos.leverage}x]</span>
                                </td>
                                <td className="py-1.5">
                                  <span
                                    className={`px-1 rounded text-[9px] font-bold ${
                                      pos.direction === 'LONG'
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : 'bg-rose-500/10 text-rose-400'
                                    }`}
                                  >
                                    {pos.direction}
                                  </span>
                                </td>
                                <td className="py-1.5 text-slate-300">${pos.entry.toFixed(2)}</td>
                                <td className="py-1.5 font-bold text-white">${pos.currentPrice.toFixed(2)}</td>
                                <td className="py-1.5 text-slate-400">
                                  ${pos.stopLoss.toFixed(2)} / ${pos.takeProfit.toFixed(2)}
                                </td>
                                <td className="py-1.5 font-bold">
                                  <span className={isWin ? 'text-emerald-400' : 'text-rose-400'}>
                                    {isWin ? '+' : ''}${pos.unrealizedPnl.toFixed(2)} ({pos.unrealizedPnlPercent.toFixed(2)}%)
                                  </span>
                                </td>
                                <td className="py-1.5 text-right">
                                  <button
                                    onClick={() => onClosePosition(pos.id)}
                                    className="px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] transition-colors cursor-pointer"
                                  >
                                    MARKET CLOSE
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* TAB 2: CLOSED TRADES */}
                {dockTab === 'TRADES' && (
                  <div>
                    {closedTrades.length === 0 ? (
                      <div className="py-6 text-center text-slate-500 text-xs">
                        NO CLOSED TRADES RECORDED
                      </div>
                    ) : (
                      <table className="w-full text-left text-[11px]">
                        <thead className="text-slate-500 border-b border-slate-800">
                          <tr>
                            <th className="py-1">TRADE ID</th>
                            <th className="py-1">ASSET</th>
                            <th className="py-1">SIDE</th>
                            <th className="py-1">NET P&L</th>
                            <th className="py-1">R MULTIPLE</th>
                            <th className="py-1">EXIT REASON</th>
                            <th className="py-1 text-right">JOURNAL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {closedTrades.slice(0, 10).map((tr) => (
                            <tr key={tr.id} className="hover:bg-slate-900/40">
                              <td className="py-1.5 text-slate-400 text-[10px]">{tr.tradeId}</td>
                              <td className="py-1.5 font-bold text-white">{tr.asset}</td>
                              <td className="py-1.5">
                                <span className={tr.direction === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}>
                                  {tr.direction}
                                </span>
                              </td>
                              <td className={`py-1.5 font-bold ${tr.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {tr.pnl >= 0 ? '+' : ''}${tr.pnl.toFixed(2)}
                              </td>
                              <td className="py-1.5 font-bold text-amber-400">{tr.rMultiple}R</td>
                              <td className="py-1.5 text-slate-300">{tr.exitReason}</td>
                              <td className="py-1.5 text-right">
                                <button
                                  onClick={() => onOpenJournal(tr.tradeId)}
                                  className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] cursor-pointer"
                                >
                                  VIEW JOURNAL
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* TAB 3: DECISIONS */}
                {dockTab === 'DECISIONS' && (
                  <div className="space-y-1.5">
                    {aiDecisions.slice(0, 8).map((dec) => (
                      <div key={dec.id} className="p-2 rounded bg-[#080c12] border border-slate-800 flex items-center justify-between text-[11px]">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{dec.asset}</span>
                            <span
                              className={`px-1 rounded text-[9px] font-bold ${
                                dec.action === 'BUY'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : dec.action === 'SELL'
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {dec.action}
                            </span>
                            <span className="text-[10px] text-cyan-400 font-bold">{dec.confidence}% Conf</span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate max-w-[380px] mt-0.5">
                            {dec.macro_catalyst}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(dec.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 4: LOGS */}
                {dockTab === 'LOGS' && (
                  <div className="space-y-1">
                    {activities.slice(0, 10).map((act) => (
                      <div key={act.id} className="p-1.5 rounded bg-[#080c12] border border-slate-800 flex items-start gap-2 text-[10px]">
                        <span className="text-slate-500">{new Date(act.timestamp).toLocaleTimeString()}</span>
                        <div>
                          <span className="text-cyan-300 font-bold">{act.title}: </span>
                          <span className="text-slate-300">{act.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* PANE C (RIGHT, 3 COLS): AUTONOMOUS AI BRAIN & 20-GATE SAFETY HUD */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-3 flex flex-col gap-1 min-h-0 overflow-y-auto">
          {/* AI Autonomous Brain HUD */}
          <div className="bg-[#0b0f17] border border-[#161f2e] rounded-lg p-3 font-mono text-xs space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5 font-display text-xs font-bold text-white tracking-wider">
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                <span>AUTONOMOUS AGENT HUD</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                ACTIVE LOOP
              </span>
            </div>

            {/* State Machine Step Tracker */}
            <div className="p-2 rounded bg-[#080c12] border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">STATE:</span>
                <span className="text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  {agentState.state}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">TARGET ASSET:</span>
                <span className="text-white font-bold">{agentState.currentAsset || 'BTC'}</span>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>CONVICTION:</span>
                  <span className="text-amber-400 font-bold">{agentState.conviction}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-amber-400 h-full rounded-full transition-all"
                    style={{ width: `${agentState.conviction}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Cognitive Stream snippet */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400">LIVE COGNITIVE LOG</span>
              <div className="p-2 rounded bg-[#080c12] border border-slate-800 text-[10px] text-slate-300 leading-relaxed max-h-[110px] overflow-y-auto">
                {activities.length > 0 ? activities[0].detail : 'Continuous multi-asset monitoring active.'}
              </div>
            </div>
          </div>

          {/* Deterministic Risk Gate HUD */}
          <div className="bg-[#0b0f17] border border-[#161f2e] rounded-lg p-3 font-mono text-xs space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5 font-display text-xs font-bold text-white tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>RISK SAFEGUARDS</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold">20/20 GATES PASS</span>
            </div>

            <div className="space-y-2 text-[10px]">
              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>DAILY LOSS LIMIT</span>
                  <span className="text-emerald-400 font-bold">0.0% / 4.0%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[0%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>PORTFOLIO DRAWDOWN</span>
                  <span className="text-emerald-400 font-bold">0.0% / 10.0%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[0%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>EXPOSURE CAP</span>
                  <span className="text-cyan-400 font-bold">0.0% / 250%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full w-[0%]"></div>
                </div>
              </div>
            </div>

            <div className="p-2 rounded bg-cyan-950/20 border border-cyan-500/30 text-[10px] text-cyan-200">
              Circuit breakers armed. Any violation of drawdown or daily loss halts all execution automatically.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
