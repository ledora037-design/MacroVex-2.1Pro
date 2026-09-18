import React, { useEffect, useState } from 'react';
import {
  BarChart2,
  CheckCircle2,
  Cpu,
  Flame,
  Layers,
  Scale,
  Shield,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { BacktestRecord } from '../types.js';

interface ComparisonItem {
  metric: string;
  historicalBacktest: string;
  currentPaper: string;
  targetExpectation: string;
  category: 'OBSERVED' | 'ESTIMATED' | 'TARGET';
}

export const BacktestLab: React.FC = () => {
  const [backtest, setBacktest] = useState<BacktestRecord | null>(null);
  const [comparison, setComparison] = useState<ComparisonItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBacktest = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/backtest');
        if (res.ok) {
          const data = await res.json();
          setBacktest(data.records?.[0] || null);
          setComparison(data.comparison || []);
        }
      } catch (err) {
        console.error('Failed to load backtest data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBacktest();
  }, []);

  const riskRules = [
    { id: 1, name: 'Data Freshness Gate', desc: 'Quote timestamps must be < 120s old and status AVAILABLE.' },
    { id: 2, name: 'Instrument Verification', desc: 'Asset must be mapped in active 24-instrument universe.' },
    { id: 3, name: 'Direction Validity', desc: 'Only LONG or SHORT signals authorized.' },
    { id: 4, name: 'Entry Price Sanity', desc: 'Positive, finite entry price matching mark price.' },
    { id: 5, name: 'Stop Loss Geometry', desc: 'LONG: SL < Entry. SHORT: SL > Entry. No inverted geometry.' },
    { id: 6, name: 'Take Profit Geometry', desc: 'LONG: TP > Entry. SHORT: TP < Entry.' },
    { id: 7, name: 'Minimum R:R Threshold', desc: 'Mandatory minimum 1.5:1 R:R, target 2.1:1.' },
    { id: 8, name: 'AI Confidence Filter', desc: 'Minimum 65% confidence required for autonomous orders.' },
    { id: 9, name: 'Per-Trade Risk Cap', desc: 'Risk amount capped at 2.0% of portfolio equity.' },
    { id: 10, name: 'Portfolio Total Exposure', desc: 'Total notional exposure capped at 250% of equity.' },
    { id: 11, name: 'Correlated Sector Cap', desc: 'Max 150% notional exposure in any single sector.' },
    { id: 12, name: 'Max Open Positions', desc: 'Maximum 5 concurrent open positions.' },
    { id: 13, name: 'Daily Trade Frequency Limit', desc: 'Maximum 5 new executions per 24h trading day.' },
    { id: 14, name: 'Daily Loss Circuit Breaker', desc: 'Halt all trading if daily loss reaches 4.0%.' },
    { id: 15, name: 'Max Drawdown Circuit Breaker', desc: 'Halt all trading if total portfolio drawdown reaches 10.0%.' },
    { id: 16, name: 'Volatility & Spread Safety', desc: 'Validates spread within safety threshold.' },
    { id: 17, name: 'Instrument Leverage Ceiling', desc: 'Caps leverage to asset maximum (max 10x).' },
    { id: 18, name: 'Margin Availability Check', desc: 'Required margin must not exceed available margin.' },
    { id: 19, name: 'Stop Distance Validation', desc: 'Stop loss distance must be between 0.3% and 10%.' },
    { id: 20, name: 'Duplicate Position Prevention', desc: 'Rejects duplicate positions in same asset and direction.' },
  ];

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* 1. Header banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#0d1424] via-[#10182b] to-[#0c121e] border border-cyan-500/20 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              <h1 className="font-display text-sm font-bold tracking-wider text-cyan-400">
                STRATEGY LAB & DETERMINISTIC RISK CONTROLS
              </h1>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Historical Walk-Forward Backtest Verification • Live vs Backtest Drift Tracking • 20-Gate Safety Architecture
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">STRATEGY: </span>
            <span className="text-cyan-300 font-bold">MACROVEX-EVENT-TA-V2.1</span>
          </div>
        </div>
      </div>

      {/* 2. Walk-Forward Backtest Metrics Strip */}
      {backtest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 p-4 rounded-xl bg-[#0e1422] border border-slate-800/80 font-mono text-xs">
          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 text-[10px]">NET RETURN</span>
            <div className="text-base font-bold text-emerald-400 mt-0.5">+{backtest.netReturn}%</div>
            <div className="text-[10px] text-slate-500">365-Day Window</div>
          </div>

          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 text-[10px]">WIN RATE</span>
            <div className="text-base font-bold text-cyan-400 mt-0.5">{backtest.winRate}%</div>
            <div className="text-[10px] text-slate-500">{backtest.totalTrades} Total Trades</div>
          </div>

          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 text-[10px]">PROFIT FACTOR</span>
            <div className="text-base font-bold text-white mt-0.5">{backtest.profitFactor}</div>
            <div className="text-[10px] text-slate-500">Gross Win / Gross Loss</div>
          </div>

          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 text-[10px]">MAX DRAWDOWN</span>
            <div className="text-base font-bold text-amber-400 mt-0.5">-{backtest.maxDrawdown}%</div>
            <div className="text-[10px] text-slate-500">Cap: -10.0%</div>
          </div>

          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 text-[10px]">SHARPE / SORTINO</span>
            <div className="text-base font-bold text-white mt-0.5">
              {backtest.sharpe} / {backtest.sortino}
            </div>
            <div className="text-[10px] text-slate-500">Rf = 4.0%</div>
          </div>

          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 text-[10px]">AVG R:R & HOLD</span>
            <div className="text-base font-bold text-cyan-300 mt-0.5">
              {backtest.averageRR}R • {backtest.averageHoldingTime}
            </div>
            <div className="text-[10px] text-slate-500">Avg Duration</div>
          </div>
        </div>
      )}

      {/* 3. Live Paper vs Historical Backtest Comparison Table */}
      <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <h2 className="font-display text-sm font-bold text-white tracking-wide">
              LIVE PAPER VS HISTORICAL BACKTEST PERFORMANCE
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Audit of Strategy Calibration & Drift
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#090d14] text-slate-400 text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">METRIC</th>
                <th className="py-2.5 px-3">HISTORICAL BACKTEST</th>
                <th className="py-2.5 px-3">CURRENT LIVE PAPER</th>
                <th className="py-2.5 px-3">TARGET EXPECTATION</th>
                <th className="py-2.5 px-3 text-right">TAG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {comparison.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">{row.metric}</td>
                  <td className="py-2.5 px-3 text-cyan-300">{row.historicalBacktest}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">{row.currentPaper}</td>
                  <td className="py-2.5 px-3 text-slate-400">{row.targetExpectation}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        row.category === 'OBSERVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : row.category === 'ESTIMATED'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {row.category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. The 20 Deterministic Risk Engine Gates */}
      <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="font-display text-sm font-bold text-white tracking-wide">
              DETERMINISTIC 20-RULE RISK ENGINE SPECIFICATION
            </h2>
          </div>
          <span className="text-xs font-mono text-emerald-400">
            ALL 20 GATES ENFORCED BEFORE ANY EXECUTION
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono text-xs">
          {riskRules.map((rule) => (
            <div
              key={rule.id}
              className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-[11px] flex items-center gap-1">
                  <span className="text-cyan-400">#{rule.id}</span> {rule.name}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">{rule.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
