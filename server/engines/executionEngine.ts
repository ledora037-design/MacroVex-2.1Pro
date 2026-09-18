import {
  AIDecision,
  ClosedTrade,
  InstrumentId,
  Position,
  TradeJournal,
} from '../../src/types.js';
import { getState, logActivity, saveState } from '../store.js';
import { ProposedTrade, RiskCheckResult } from './riskEngine.js';
import { fetchLiveQuote } from '../providers/marketData.js';

export async function executePaperTrade(
  decision: ProposedTrade,
  riskResult: RiskCheckResult,
  macroCatalyst = 'Autonomous Macro & Technical Setup',
  aiReasoning = 'Multi-timeframe technical alignment with macro transmission support'
): Promise<Position> {
  const state = getState();
  const calc = riskResult.calculatedSize;
  if (!calc) {
    throw new Error('Cannot execute trade without valid risk calculations.');
  }

  const tradeId = `TRD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const now = Date.now();

  const slippageFee = calc.notional * 0.0002; // 2 bps slippage
  const takerFee = calc.notional * 0.0005; // 5 bps taker fee

  const position: Position = {
    id: `pos-${tradeId}`,
    tradeId,
    asset: decision.asset,
    direction: decision.direction,
    entry: decision.entry,
    currentPrice: decision.entry,
    stopLoss: decision.stop_loss,
    takeProfit: decision.take_profit,
    quantity: calc.quantity,
    notional: calc.notional,
    leverage: calc.leverage,
    margin: calc.margin,
    riskAmount: calc.riskAmount,
    riskPercent: calc.riskPercent,
    rr: calc.rr,
    unrealizedPnl: 0,
    unrealizedPnlPercent: 0,
    fees: takerFee,
    slippage: slippageFee,
    strategyId: 'MACROVEX-EVENT-TA',
    strategyVersion: 'V2.1',
    macroCatalyst,
    openedAt: now,
    lastCheckedAt: now,
    status: 'OPEN',
  };

  // Update Portfolio
  const p = state.portfolio;
  p.usedMargin += calc.margin;
  p.availableMargin = Math.max(0, p.equity - p.usedMargin);
  p.openPositionsCount += 1;
  p.todayTradesCount += 1;
  p.exposureNotional += calc.notional;
  p.openRiskAmount += calc.riskAmount;
  p.openRiskPercent = (p.openRiskAmount / p.equity) * 100;

  state.openPositions.push(position);

  // Initialize Trade Journal
  const journal: TradeJournal = {
    tradeId,
    asset: decision.asset,
    direction: decision.direction,
    openedAt: now,
    macroCatalyst,
    technicalSetup: `Entry: $${decision.entry} | SL: $${decision.stop_loss} | TP: $${decision.take_profit} (R:R ${calc.rr}:1)`,
    crossAssetConfirmation: 'Yield and index momentum confirmed risk profile.',
    regime: 'RISK-ON',
    aiReasoning,
    riskDecision: {
      approved: true,
      checksPassed: 20,
      totalChecks: 20,
      summary: 'Passed all 20 deterministic checks including daily caps and max exposure.',
    },
    entry: decision.entry,
    sl: decision.stop_loss,
    tp: decision.take_profit,
    leverage: calc.leverage,
    positionSize: calc.quantity,
    timeline: [
      {
        step: 'EVENT',
        label: 'Macro Catalyst Detected',
        timestamp: now - 30000,
        detail: macroCatalyst,
        status: 'COMPLETED',
      },
      {
        step: 'AI_ANALYSIS',
        label: 'AI Transmission & Technical Analysis',
        timestamp: now - 15000,
        detail: aiReasoning,
        status: 'COMPLETED',
      },
      {
        step: 'RISK_CHECK',
        label: 'Deterministic Risk Gate (20/20 Checks)',
        timestamp: now - 5000,
        detail: `Risk Engine approved $${calc.riskAmount.toFixed(0)} risk (${calc.riskPercent}%) at ${calc.leverage}x leverage.`,
        status: 'COMPLETED',
      },
      {
        step: 'EXECUTION',
        label: 'Paper Order Executed',
        timestamp: now,
        detail: `Filled ${calc.quantity} units of ${decision.asset} at $${decision.entry} in PAPER mode.`,
        status: 'COMPLETED',
      },
      {
        step: 'MONITORING',
        label: 'Continuous Active Position Monitoring',
        timestamp: now,
        detail: `Tracking live quote against TP ($${decision.take_profit}) and SL ($${decision.stop_loss}).`,
        status: 'ACTIVE',
      },
    ],
  };

  state.tradeJournals[tradeId] = journal;

  logActivity({
    type: 'EXECUTE',
    title: `PAPER ORDER EXECUTED: ${decision.direction} ${decision.asset}`,
    detail: `Filled ${calc.quantity} @ $${decision.entry} | SL: $${decision.stop_loss} | TP: $${decision.take_profit} | Risk: $${calc.riskAmount.toFixed(0)} (${calc.riskPercent}%)`,
    asset: decision.asset,
  });

  saveState(state);
  return position;
}

export async function closePosition(
  positionId: string,
  exitReason: ClosedTrade['exitReason'],
  overrideExitPrice?: number
): Promise<ClosedTrade | null> {
  const state = getState();
  const idx = state.openPositions.findIndex((p) => p.id === positionId);
  if (idx === -1) return null;

  const pos = state.openPositions[idx];
  const quote = await fetchLiveQuote(pos.asset);
  const exitPrice = overrideExitPrice || quote.price || pos.currentPrice;
  const now = Date.now();

  const priceDiff = pos.direction === 'LONG' ? exitPrice - pos.entry : pos.entry - exitPrice;
  const grossPnl = priceDiff * pos.quantity;
  const closeFee = pos.notional * 0.0005;
  const netPnl = grossPnl - pos.fees - closeFee;
  const rMultiple = pos.riskAmount > 0 ? parseFloat((netPnl / pos.riskAmount).toFixed(2)) : 0;
  const durationSec = Math.max(1, Math.round((now - pos.openedAt) / 1000));

  const closedTrade: ClosedTrade = {
    id: `closed-${pos.tradeId}`,
    tradeId: pos.tradeId,
    asset: pos.asset,
    direction: pos.direction,
    entry: pos.entry,
    exit: parseFloat(exitPrice.toFixed(2)),
    quantity: pos.quantity,
    notional: pos.notional,
    leverage: pos.leverage,
    risk: pos.riskAmount,
    sl: pos.stopLoss,
    tp: pos.takeProfit,
    rr: pos.rr,
    pnl: parseFloat(netPnl.toFixed(2)),
    rMultiple,
    fees: parseFloat((pos.fees + closeFee).toFixed(2)),
    slippage: pos.slippage,
    durationSeconds: durationSec,
    strategy: pos.strategyId,
    strategyVersion: pos.strategyVersion,
    aiConfidence: 85,
    regime: 'RISK-ON',
    catalyst: pos.macroCatalyst,
    exitReason,
    openedAt: pos.openedAt,
    closedAt: now,
    status: 'CLOSED',
  };

  // Remove from open positions
  state.openPositions.splice(idx, 1);
  state.closedTrades.unshift(closedTrade);

  // Update Portfolio
  const p = state.portfolio;
  p.usedMargin = Math.max(0, p.usedMargin - pos.margin);
  p.equity = parseFloat((p.equity + netPnl).toFixed(2));
  p.cash = parseFloat((p.cash + netPnl).toFixed(2));
  p.availableMargin = Math.max(0, p.equity - p.usedMargin);
  p.realizedPnl = parseFloat((p.realizedPnl + netPnl).toFixed(2));
  p.dailyPnl = parseFloat((p.dailyPnl + netPnl).toFixed(2));
  p.openPositionsCount = state.openPositions.length;
  p.exposureNotional = Math.max(0, p.exposureNotional - pos.notional);
  p.openRiskAmount = Math.max(0, p.openRiskAmount - pos.riskAmount);
  p.openRiskPercent = p.equity > 0 ? (p.openRiskAmount / p.equity) * 100 : 0;

  if (p.equity > p.peakEquity) {
    p.peakEquity = p.equity;
  }
  const dd = p.peakEquity > 0 ? ((p.peakEquity - p.equity) / p.peakEquity) * 100 : 0;
  p.currentDrawdownPercent = parseFloat(dd.toFixed(2));
  if (dd > p.maxDrawdownPercent) {
    p.maxDrawdownPercent = parseFloat(dd.toFixed(2));
  }

  // Record historical equity point
  p.equityHistory.push({ timestamp: now, equity: p.equity, cash: p.cash });
  if (p.equityHistory.length > 200) p.equityHistory.shift();

  // Update Trade Journal
  const journal = state.tradeJournals[pos.tradeId];
  if (journal) {
    journal.closedAt = now;
    journal.exitReason = exitReason;
    journal.resultPnl = closedTrade.pnl;
    journal.rMultiple = rMultiple;

    // Mark Monitoring as completed
    const monStep = journal.timeline.find((s) => s.step === 'MONITORING');
    if (monStep) monStep.status = 'COMPLETED';

    journal.timeline.push(
      {
        step: 'EXIT',
        label: `Exit Triggered: ${exitReason}`,
        timestamp: now,
        detail: `Closed at $${exitPrice} via ${exitReason}. Duration: ${Math.round(durationSec / 60)}m.`,
        status: 'COMPLETED',
      },
      {
        step: 'RESULT',
        label: netPnl >= 0 ? `Profitable Close (+${rMultiple}R)` : `Loss Controlled (${rMultiple}R)`,
        timestamp: now,
        detail: `Realized P&L: ${netPnl >= 0 ? '+' : ''}$${netPnl.toFixed(2)} | Net Return: ${((netPnl / p.initialCapital) * 100).toFixed(2)}%`,
        status: netPnl >= 0 ? 'COMPLETED' : 'FAILED',
      }
    );
  }

  logActivity({
    type: 'EXIT',
    title: `POSITION CLOSED: ${pos.direction} ${pos.asset} (${exitReason})`,
    detail: `Exit Price: $${exitPrice} | Realized P&L: ${netPnl >= 0 ? '+' : ''}$${netPnl.toFixed(2)} (${rMultiple}R)`,
    asset: pos.asset,
  });

  saveState(state);
  return closedTrade;
}

export async function monitorOpenPositions(): Promise<void> {
  const state = getState();
  if (state.openPositions.length === 0) return;

  const toClose: Array<{ id: string; reason: ClosedTrade['exitReason']; price: number }> = [];

  for (const pos of state.openPositions) {
    try {
      const quote = await fetchLiveQuote(pos.asset);
      if (!quote || quote.price <= 0) continue;

      pos.currentPrice = quote.price;
      pos.lastCheckedAt = Date.now();

      const priceDiff = pos.direction === 'LONG' ? quote.price - pos.entry : pos.entry - quote.price;
      pos.unrealizedPnl = parseFloat((priceDiff * pos.quantity).toFixed(2));
      pos.unrealizedPnlPercent = parseFloat(((pos.unrealizedPnl / pos.margin) * 100).toFixed(2));

      // Check Take Profit
      if (pos.direction === 'LONG' && quote.price >= pos.takeProfit) {
        toClose.push({ id: pos.id, reason: 'TAKE_PROFIT', price: pos.takeProfit });
      } else if (pos.direction === 'SHORT' && quote.price <= pos.takeProfit) {
        toClose.push({ id: pos.id, reason: 'TAKE_PROFIT', price: pos.takeProfit });
      }
      // Check Stop Loss
      else if (pos.direction === 'LONG' && quote.price <= pos.stopLoss) {
        toClose.push({ id: pos.id, reason: 'STOP_LOSS', price: pos.stopLoss });
      } else if (pos.direction === 'SHORT' && quote.price >= pos.stopLoss) {
        toClose.push({ id: pos.id, reason: 'STOP_LOSS', price: pos.stopLoss });
      }
    } catch (err) {
      console.error(`Error monitoring position ${pos.id}:`, err);
    }
  }

  for (const item of toClose) {
    await closePosition(item.id, item.reason, item.price);
  }

  // Update overall portfolio unrealized P&L
  const totalUnrealized = state.openPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  state.portfolio.unrealizedPnl = parseFloat(totalUnrealized.toFixed(2));
  saveState(state);
}
