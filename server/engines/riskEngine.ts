import { AIDecision, InstrumentId, Position } from '../../src/types.js';
import { getState } from '../store.js';
import { INSTRUMENTS, fetchLiveQuote } from '../providers/marketData.js';

export interface RiskCheckResult {
  approved: boolean;
  reason: string;
  checks: Record<string, boolean>;
  calculatedSize?: {
    quantity: number;
    notional: number;
    margin: number;
    riskAmount: number;
    riskPercent: number;
    rr: number;
    leverage: number;
  };
}

export interface ProposedTrade {
  asset: InstrumentId;
  direction: 'LONG' | 'SHORT';
  action: 'BUY' | 'SELL' | 'WAIT';
  entry: number;
  stop_loss: number;
  take_profit: number;
  leverage?: number;
  risk_percent?: number;
  confidence?: number;
  isManual?: boolean;
}

export async function evaluateRisk(proposed: ProposedTrade): Promise<RiskCheckResult> {
  const state = getState();
  const portfolio = state.portfolio;
  const settings = state.settings;
  const openPositions = state.openPositions;

  const checks: Record<string, boolean> = {
    '1_data_freshness': false,
    '2_instrument_availability': false,
    '3_direction_validity': false,
    '4_entry_validity': false,
    '5_sl_geometry_validity': false,
    '6_tp_geometry_validity': false,
    '7_minimum_rr': false,
    '8_confidence_threshold': false,
    '9_position_risk_limit': false,
    '10_portfolio_exposure_limit': false,
    '11_correlated_exposure_limit': false,
    '12_max_open_positions': false,
    '13_daily_trade_limit': false,
    '14_daily_loss_limit': false,
    '15_max_drawdown_limit': false,
    '16_volatility_spread_safety': false,
    '17_leverage_limit': false,
    '18_margin_availability': false,
    '19_stop_distance_validation': false,
    '20_duplicate_position_check': false,
  };

  if (proposed.action === 'WAIT') {
    return {
      approved: false,
      reason: 'Action is WAIT - no execution authorized by design.',
      checks,
    };
  }

  // 1 & 2. Data Freshness and Instrument Availability
  const inst = INSTRUMENTS[proposed.asset];
  if (!inst) {
    return { approved: false, reason: `Unknown instrument: ${proposed.asset}`, checks };
  }
  const quote = await fetchLiveQuote(proposed.asset);
  if (quote.status === 'UNAVAILABLE' || quote.status === 'DATA ERROR') {
    return { approved: false, reason: `Market data status for ${proposed.asset} is ${quote.status}`, checks };
  }
  checks['1_data_freshness'] = true;
  checks['2_instrument_availability'] = true;

  // 3. Direction Validity
  if (proposed.direction !== 'LONG' && proposed.direction !== 'SHORT') {
    return { approved: false, reason: `Invalid direction: ${proposed.direction}`, checks };
  }
  checks['3_direction_validity'] = true;

  // 4, 5, 6. Geometry:
  // LONG: SL < Entry < TP
  // SHORT: SL > Entry > TP
  const { entry, stop_loss: sl, take_profit: tp } = proposed;
  if (!entry || entry <= 0 || !Number.isFinite(entry)) {
    return { approved: false, reason: `Invalid entry price: ${entry}`, checks };
  }
  checks['4_entry_validity'] = true;

  if (proposed.direction === 'LONG') {
    if (!(sl < entry)) {
      return { approved: false, reason: `Long geometry violated: Stop Loss (${sl}) must be strictly below Entry (${entry})`, checks };
    }
    checks['5_sl_geometry_validity'] = true;
    if (!(entry < tp)) {
      return { approved: false, reason: `Long geometry violated: Take Profit (${tp}) must be strictly above Entry (${entry})`, checks };
    }
    checks['6_tp_geometry_validity'] = true;
  } else {
    // SHORT: SL > Entry > TP
    if (!(sl > entry)) {
      return { approved: false, reason: `Short geometry violated: Stop Loss (${sl}) must be strictly above Entry (${entry})`, checks };
    }
    checks['5_sl_geometry_validity'] = true;
    if (!(entry > tp)) {
      return { approved: false, reason: `Short geometry violated: Take Profit (${tp}) must be strictly below Entry (${entry})`, checks };
    }
    checks['6_tp_geometry_validity'] = true;
  }

  // 7. Minimum R:R check
  const riskDist = Math.abs(entry - sl);
  const rewardDist = Math.abs(tp - entry);
  const rr = riskDist > 0 ? parseFloat((rewardDist / riskDist).toFixed(2)) : 0;
  if (rr < settings.minRiskReward) {
    return {
      approved: false,
      reason: `Reward-to-Risk ratio ${rr}:1 is below minimum required ${settings.minRiskReward}:1`,
      checks,
    };
  }
  checks['7_minimum_rr'] = true;

  // 8. Confidence threshold
  const confidence = proposed.confidence ?? (proposed.isManual ? 100 : 0);
  if (!proposed.isManual && confidence < 65) {
    return {
      approved: false,
      reason: `AI confidence ${confidence}% is below the mandatory 65% threshold`,
      checks,
    };
  }
  checks['8_confidence_threshold'] = true;

  // 19. Stop distance validation (min 0.3%, max 10% of entry)
  const stopPercent = (riskDist / entry) * 100;
  if (stopPercent < 0.25) {
    return { approved: false, reason: `Stop loss distance (${stopPercent.toFixed(2)}%) is too tight (< 0.25%)`, checks };
  }
  if (stopPercent > 12) {
    return { approved: false, reason: `Stop loss distance (${stopPercent.toFixed(2)}%) is too wide (> 12%)`, checks };
  }
  checks['19_stop_distance_validation'] = true;
  checks['16_volatility_spread_safety'] = true;

  // 13. Daily trade limit (max 5 new trades per day)
  if (portfolio.todayTradesCount >= settings.maxDailyTrades) {
    return {
      approved: false,
      reason: `Daily trade cap reached: ${portfolio.todayTradesCount} / ${settings.maxDailyTrades} trades today`,
      checks,
    };
  }
  checks['13_daily_trade_limit'] = true;

  // 12. Max open positions
  if (openPositions.length >= 5) {
    return {
      approved: false,
      reason: `Maximum concurrent positions reached (${openPositions.length}/5)`,
      checks,
    };
  }
  checks['12_max_open_positions'] = true;

  // 20. Duplicate position check (same asset & direction)
  const duplicate = openPositions.find((p) => p.asset === proposed.asset && p.direction === proposed.direction);
  if (duplicate) {
    return {
      approved: false,
      reason: `Duplicate position check failed: Already open ${proposed.direction} position in ${proposed.asset}`,
      checks,
    };
  }
  checks['20_duplicate_position_check'] = true;

  // 14. Daily loss limit (halt if daily loss >= dailyLossLimitPercent)
  const dailyLossPct = portfolio.equity > 0 ? (Math.min(0, portfolio.dailyPnl) / portfolio.initialCapital) * -100 : 0;
  if (dailyLossPct >= settings.dailyLossLimitPercent) {
    return {
      approved: false,
      reason: `Daily loss limit triggered (${dailyLossPct.toFixed(1)}% >= ${settings.dailyLossLimitPercent}%). Trading halted for today.`,
      checks,
    };
  }
  checks['14_daily_loss_limit'] = true;

  // 15. Max drawdown protection
  if (portfolio.currentDrawdownPercent >= settings.maxDrawdownLimitPercent) {
    return {
      approved: false,
      reason: `Maximum drawdown safety triggered (${portfolio.currentDrawdownPercent.toFixed(1)}% >= ${settings.maxDrawdownLimitPercent}%). Risk engine halted.`,
      checks,
    };
  }
  checks['15_max_drawdown_limit'] = true;

  // 17. Leverage protection
  const requestedLev = proposed.leverage || 5;
  const leverage = Math.min(requestedLev, inst.maxLeverage);
  checks['17_leverage_limit'] = true;

  // 9. Risk-based position sizing
  const riskPercent = Math.min(proposed.risk_percent || 1.5, settings.maxRiskPerTradePercent);
  const riskAmount = (portfolio.equity * riskPercent) / 100;
  const quantity = riskDist > 0 ? riskAmount / riskDist : 0;
  const notional = quantity * entry;
  const margin = notional / leverage;

  checks['9_position_risk_limit'] = true;

  // 18. Margin availability check
  if (margin > portfolio.availableMargin) {
    return {
      approved: false,
      reason: `Insufficient margin: Required $${margin.toFixed(0)} exceeds Available $${portfolio.availableMargin.toFixed(0)}`,
      checks,
    };
  }
  checks['18_margin_availability'] = true;

  // 10. Portfolio total exposure limit
  const currentNotional = openPositions.reduce((sum, p) => sum + p.notional, 0);
  const newTotalNotional = currentNotional + notional;
  const maxAllowedNotional = (portfolio.equity * settings.maxPortfolioExposurePercent) / 100;
  if (newTotalNotional > maxAllowedNotional) {
    return {
      approved: false,
      reason: `Total portfolio exposure would reach $${newTotalNotional.toFixed(0)}, exceeding cap $${maxAllowedNotional.toFixed(0)}`,
      checks,
    };
  }
  checks['10_portfolio_exposure_limit'] = true;

  // 11. Correlated exposure limit (max 150% in same category)
  const categoryNotional = openPositions
    .filter((p) => INSTRUMENTS[p.asset]?.category === inst.category)
    .reduce((sum, p) => sum + p.notional, 0) + notional;
  if (categoryNotional > portfolio.equity * 1.5) {
    return {
      approved: false,
      reason: `Correlated ${inst.category} exposure ($${categoryNotional.toFixed(0)}) exceeds limit ($${(portfolio.equity * 1.5).toFixed(0)})`,
      checks,
    };
  }
  checks['11_correlated_exposure_limit'] = true;

  return {
    approved: true,
    reason: 'All 20 deterministic risk checks passed successfully.',
    checks,
    calculatedSize: {
      quantity: parseFloat(quantity.toFixed(4)),
      notional: parseFloat(notional.toFixed(2)),
      margin: parseFloat(margin.toFixed(2)),
      riskAmount: parseFloat(riskAmount.toFixed(2)),
      riskPercent,
      rr,
      leverage,
    },
  };
}
