import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  Layers,
  PieChart,
} from 'lucide-react';
import { PortfolioState } from '../types.js';

interface PortfolioStatsProps {
  portfolio: PortfolioState;
}

export const PortfolioStats: React.FC<PortfolioStatsProps> = ({ portfolio }) => {
  const returnTotal = portfolio.initialCapital > 0
    ? ((portfolio.equity - portfolio.initialCapital) / portfolio.initialCapital) * 100
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2.5 p-4 bg-[#090d14]/70 border-b border-slate-800/80">
      {/* 1. Total Portfolio Equity */}
      <div className="p-2.5 rounded-lg bg-[#0e1422] border border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>PORTFOLIO EQUITY</span>
          <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-lg font-mono font-bold text-white tracking-tight">
            ${portfolio.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="mt-0.5 text-[10px] font-mono flex items-center gap-1 text-slate-400">
          <span>Base: $100,000</span>
          <span className={returnTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            ({returnTotal >= 0 ? '+' : ''}{returnTotal.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* 2. Realized PnL */}
      <div className="p-2.5 rounded-lg bg-[#0e1422] border border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>REALIZED P&L</span>
          {portfolio.realizedPnl >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          )}
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span
            className={`text-lg font-mono font-bold tracking-tight ${
              portfolio.realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {portfolio.realizedPnl >= 0 ? '+' : ''}${portfolio.realizedPnl.toFixed(2)}
          </span>
        </div>
        <div className="mt-0.5 text-[10px] font-mono text-slate-400">
          Closed ledger returns
        </div>
      </div>

      {/* 3. Unrealized PnL */}
      <div className="p-2.5 rounded-lg bg-[#0e1422] border border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>UNREALIZED P&L</span>
          <Layers className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span
            className={`text-lg font-mono font-bold tracking-tight ${
              portfolio.unrealizedPnl > 0
                ? 'text-emerald-400'
                : portfolio.unrealizedPnl < 0
                ? 'text-rose-400'
                : 'text-slate-300'
            }`}
          >
            {portfolio.unrealizedPnl >= 0 ? '+' : ''}${portfolio.unrealizedPnl.toFixed(2)}
          </span>
        </div>
        <div className="mt-0.5 text-[10px] font-mono text-slate-400">
          Live position mark-to-market
        </div>
      </div>

      {/* 4. Daily PnL */}
      <div className="p-2.5 rounded-lg bg-[#0e1422] border border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>DAILY P&L</span>
          <span className="text-[10px] text-slate-500 font-mono">00:00 UTC</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span
            className={`text-lg font-mono font-bold tracking-tight ${
              portfolio.dailyPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {portfolio.dailyPnl >= 0 ? '+' : ''}${portfolio.dailyPnl.toFixed(2)}
          </span>
        </div>
        <div className="mt-0.5 text-[10px] font-mono text-slate-400">
          Limit: 4.0% max loss
        </div>
      </div>

      {/* 5. Drawdown */}
      <div className="p-2.5 rounded-lg bg-[#0e1422] border border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>DRAWDOWN</span>
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-lg font-mono font-bold text-amber-400 tracking-tight">
            -{portfolio.currentDrawdownPercent.toFixed(2)}%
          </span>
        </div>
        <div className="mt-0.5 text-[10px] font-mono text-slate-400">
          Peak: -{portfolio.maxDrawdownPercent.toFixed(2)}% (Max 10%)
        </div>
      </div>

      {/* 6. Margin & Exposure */}
      <div className="p-2.5 rounded-lg bg-[#0e1422] border border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>AVAILABLE MARGIN</span>
          <PieChart className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-lg font-mono font-bold text-white tracking-tight">
            ${portfolio.availableMargin.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="mt-0.5 text-[10px] font-mono text-slate-400">
          Used: ${portfolio.usedMargin.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </div>
      </div>

      {/* 7. Open Risk & Positions */}
      <div className="p-2.5 rounded-lg bg-[#0e1422] border border-slate-800/80 col-span-2 xl:col-span-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>OPEN RISK / SLOTS</span>
          <span className="text-cyan-400 font-bold font-mono">
            {portfolio.openPositionsCount} / 5
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-lg font-mono font-bold text-white tracking-tight">
            ${portfolio.openRiskAmount.toFixed(0)}
          </span>
          <span className="text-xs font-mono text-slate-400">
            ({portfolio.openRiskPercent.toFixed(1)}%)
          </span>
        </div>
        <div className="mt-0.5 text-[10px] font-mono text-slate-400">
          Max 2.0% per trade
        </div>
      </div>
    </div>
  );
};
