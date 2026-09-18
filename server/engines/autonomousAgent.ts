import { InstrumentId } from '../../src/types.js';
import { getState, logActivity, saveState } from '../store.js';
import { getAllAssetSummaries } from '../providers/marketData.js';
import { generateAIDecision } from './aiDecisionEngine.js';
import { evaluateRisk } from './riskEngine.js';
import { executePaperTrade, monitorOpenPositions } from './executionEngine.js';

let isRunning = false;
let loopTimeout: NodeJS.Timeout | null = null;

const SCAN_UNIVERSE: InstrumentId[] = [
  'BTC', 'ETH', 'SOL', 'NVDA', 'AAPL', 'SPY', 'QQQ', 'XAU', 'CL', 'BNB', 'MSFT', 'AMZN'
];
let scanIndex = 0;

export function startAutonomousAgent(): void {
  if (isRunning) return;
  isRunning = true;
  console.log('[AUTONOMOUS AGENT] Started autonomous trading loop.');
  scheduleNextCycle(2000);
}

export function stopAutonomousAgent(): void {
  isRunning = false;
  if (loopTimeout) {
    clearTimeout(loopTimeout);
    loopTimeout = null;
  }
  const s = getState();
  s.settings.isAutonomousActive = false;
  s.agentState.state = 'WAITING';
  saveState(s);
  console.log('[AUTONOMOUS AGENT] Stopped autonomous trading loop.');
}

function scheduleNextCycle(delayMs: number): void {
  if (!isRunning) return;
  if (loopTimeout) clearTimeout(loopTimeout);
  loopTimeout = setTimeout(async () => {
    try {
      await runAutonomousCycle();
    } catch (err) {
      console.error('[AUTONOMOUS AGENT] Error in cycle:', err);
    } finally {
      const s = getState();
      const intervalSec = s.settings.autonomousCycleSeconds || 20;
      scheduleNextCycle(intervalSec * 1000);
    }
  }, delayMs);
}

export async function runAutonomousCycle(): Promise<void> {
  const state = getState();

  // 1. Monitor Open Positions on each cycle
  await monitorOpenPositions();

  if (!state.settings.isAutonomousActive) {
    state.agentState.state = 'WAITING';
    saveState(state);
    return;
  }

  // 2. State: SCANNING
  state.agentState.state = 'SCANNING';
  const targetAsset = SCAN_UNIVERSE[scanIndex % SCAN_UNIVERSE.length];
  scanIndex++;
  state.agentState.currentAsset = targetAsset;
  state.agentState.lastCycleAt = Date.now();
  saveState(state);

  logActivity({
    type: 'SCAN',
    title: `SCANNING ${targetAsset}`,
    detail: `Scanning multi-timeframe order flow, market structure, and catalyst context for ${targetAsset}.`,
    asset: targetAsset,
  });

  // 3. State: ANALYZING EVENT & TECHNICALS
  state.agentState.state = 'ANALYZING EVENT';
  saveState(state);

  const decision = await generateAIDecision(targetAsset);
  state.aiDecisions.unshift(decision);
  if (state.aiDecisions.length > 50) state.aiDecisions = state.aiDecisions.slice(0, 50);

  // 4. State: CROSS-CHECKING
  state.agentState.state = 'CROSS-CHECKING';
  saveState(state);

  // If AI decision is WAIT, NEVER CREATE A TRADE!
  if (decision.action === 'WAIT') {
    state.agentState.state = 'WAITING';
    state.agentState.conviction = decision.confidence;
    saveState(state);

    logActivity({
      type: 'ANALYSIS',
      title: `AI DECISION: WAIT on ${targetAsset}`,
      detail: `No valid high-conviction setup detected (${decision.confidence}% confidence). Inactive to preserve capital.`,
      asset: targetAsset,
    });
    return;
  }

  // 5. State: RISK CHECK (Deterministic Safety Gate)
  state.agentState.state = 'RISK CHECK';
  saveState(state);

  logActivity({
    type: 'ANALYSIS',
    title: `OPPORTUNITY DETECTED: ${decision.direction} ${targetAsset}`,
    detail: `AI Conviction ${decision.confidence}%. Submitting proposal to deterministic Risk Engine.`,
    asset: targetAsset,
  });

  const riskResult = await evaluateRisk({
    asset: decision.asset,
    direction: decision.direction,
    action: decision.action,
    entry: decision.entry,
    stop_loss: decision.stop_loss,
    take_profit: decision.take_profit,
    leverage: decision.leverage,
    risk_percent: decision.risk_percent,
    confidence: decision.confidence,
    isManual: false,
  });

  decision.risk_decision = {
    approved: riskResult.approved,
    reason: riskResult.reason,
    checks: riskResult.checks,
  };

  if (!riskResult.approved) {
    state.agentState.state = 'WAITING';
    saveState(state);

    logActivity({
      type: 'RISK_REJECT',
      title: `RISK ENGINE REJECTED: ${decision.direction} ${targetAsset}`,
      detail: `Proposal rejected: ${riskResult.reason}`,
      asset: targetAsset,
    });
    return;
  }

  // 6. State: EXECUTING (Deterministic Risk Engine Approved!)
  state.agentState.state = 'EXECUTING';
  saveState(state);

  logActivity({
    type: 'RISK_PASS',
    title: `RISK ENGINE APPROVED: ${decision.direction} ${targetAsset}`,
    detail: `All 20 safety gates cleared. Passing to execution adapter (TRADING_MODE=${state.settings.tradingMode}).`,
    asset: targetAsset,
  });

  // Execute in Paper mode (or Demo if configured)
  await executePaperTrade(
    {
      asset: decision.asset,
      direction: decision.direction,
      action: decision.action,
      entry: decision.entry,
      stop_loss: decision.stop_loss,
      take_profit: decision.take_profit,
      leverage: decision.leverage,
      risk_percent: decision.risk_percent,
      confidence: decision.confidence,
    },
    riskResult,
    decision.macro_catalyst,
    decision.technical_reasoning
  );

  // 7. State: MONITORING
  state.agentState.state = 'MONITORING';
  state.agentState.conviction = decision.confidence;
  saveState(state);
}
