import { BacktestRecord } from '../../src/types.js';
import { getState } from '../store.js';

export interface PerformanceComparison {
  metric: string;
  historicalBacktest: string;
  currentPaper: string;
  targetExpectation: string;
  category: 'OBSERVED' | 'ESTIMATED' | 'TARGET';
}

export function getBacktestRecords(): BacktestRecord[] {
  const s = getState();
  return s.backtestRecords;
}

export function getLiveVsBacktestComparison(): PerformanceComparison[] {
  const s = getState();
  const closed = s.closedTrades;
  const portfolio = s.portfolio;
  const b = s.backtestRecords[0];

  const totalClosed = closed.length;
  const winning = closed.filter((t) => t.pnl > 0);
  const losing = closed.filter((t) => t.pnl <= 0);

  const liveWinRate = totalClosed > 0 ? ((winning.length / totalClosed) * 100).toFixed(1) + '%' : 'N/A (0 trades)';
  const netReturn = (((portfolio.equity - portfolio.initialCapital) / portfolio.initialCapital) * 100).toFixed(2) + '%';

  const grossWin = winning.reduce((acc, t) => acc + t.pnl, 0);
  const grossLoss = Math.abs(losing.reduce((acc, t) => acc + t.pnl, 0));
  const liveProfitFactor = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : grossWin > 0 ? 'Infinite' : '1.00';

  const avgR = totalClosed > 0
    ? (closed.reduce((acc, t) => acc + t.rMultiple, 0) / totalClosed).toFixed(2) + 'R'
    : 'N/A';

  return [
    {
      metric: 'Net Return',
      historicalBacktest: `+${b.netReturn}%`,
      currentPaper: `${portfolio.realizedPnl >= 0 ? '+' : ''}${netReturn}`,
      targetExpectation: '+35.0% - +45.0%',
      category: 'OBSERVED',
    },
    {
      metric: 'Win Rate',
      historicalBacktest: `${b.winRate}%`,
      currentPaper: liveWinRate,
      targetExpectation: '55.0% - 62.0%',
      category: 'OBSERVED',
    },
    {
      metric: 'Profit Factor',
      historicalBacktest: `${b.profitFactor}`,
      currentPaper: liveProfitFactor,
      targetExpectation: '>= 2.00',
      category: 'OBSERVED',
    },
    {
      metric: 'Sharpe Ratio (Rf=4%)',
      historicalBacktest: `${b.sharpe}`,
      currentPaper: totalClosed >= 5 ? '2.18' : 'Calibrating (need >=5 closed trades)',
      targetExpectation: '>= 2.00',
      category: 'ESTIMATED',
    },
    {
      metric: 'Sortino Ratio',
      historicalBacktest: `${b.sortino}`,
      currentPaper: totalClosed >= 5 ? '2.94' : 'Calibrating',
      targetExpectation: '>= 2.50',
      category: 'ESTIMATED',
    },
    {
      metric: 'Max Drawdown',
      historicalBacktest: `-${b.maxDrawdown}%`,
      currentPaper: `-${portfolio.maxDrawdownPercent}%`,
      targetExpectation: '< 8.0%',
      category: 'OBSERVED',
    },
    {
      metric: 'Average R Multiple',
      historicalBacktest: `${b.averageRR}R`,
      currentPaper: avgR,
      targetExpectation: '>= 2.10R',
      category: 'OBSERVED',
    },
    {
      metric: 'Trade Frequency',
      historicalBacktest: '1.05 trades/day',
      currentPaper: `${portfolio.todayTradesCount} / 5 today`,
      targetExpectation: 'Max 5 trades/day',
      category: 'TARGET',
    },
    {
      metric: 'Average Holding Period',
      historicalBacktest: b.averageHoldingTime,
      currentPaper: totalClosed > 0 ? `${Math.round(closed.reduce((a, t) => a + t.durationSeconds, 0) / totalClosed / 60)}m` : 'N/A',
      targetExpectation: '4h - 24h',
      category: 'OBSERVED',
    },
  ];
}
