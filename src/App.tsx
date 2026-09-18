import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './components/Header.js';
import { PortfolioStats } from './components/PortfolioStats.js';
import { UnifiedTradingDesk } from './components/UnifiedTradingDesk.js';
import { OperationsCenter } from './components/OperationsCenter.js';
import { AssetIntelligenceDesk } from './components/AssetIntelligenceDesk.js';
import { MacroEventsHub } from './components/MacroEventsHub.js';
import { TradeLedger } from './components/TradeLedger.js';
import { BacktestLab } from './components/BacktestLab.js';
import { TradeJournalModal } from './components/TradeJournalModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { SystemHealthModal } from './components/SystemHealthModal.js';
import {
  AIDecision,
  AIActivityItem,
  AppSettings,
  AssetSummary,
  ClosedTrade,
  MarketRegime,
  PortfolioState,
  Position,
} from './types.js';

const INITIAL_SETTINGS: AppSettings = {
  tradingMode: 'PAPER',
  liveModeConfirmed: false,
  maxDailyTrades: 5,
  maxRiskPerTradePercent: 2.0,
  maxPortfolioExposurePercent: 250,
  dailyLossLimitPercent: 4.0,
  maxDrawdownLimitPercent: 10.0,
  minRiskReward: 1.5,
  preferredRiskReward: 2.1,
  autonomousCycleSeconds: 20,
  isAutonomousActive: true,
  bitgetMode: 'demo',
  hasBitgetCreds: false,
  hasCmcCreds: false,
  hasNewsCreds: false,
  hasGeminiKey: false,
};

const INITIAL_PORTFOLIO: PortfolioState = {
  equity: 100000,
  initialCapital: 100000,
  cash: 100000,
  availableMargin: 100000,
  usedMargin: 0,
  unrealizedPnl: 0,
  realizedPnl: 0,
  dailyPnl: 0,
  weeklyPnl: 0,
  peakEquity: 100000,
  maxDrawdownPercent: 0,
  currentDrawdownPercent: 0,
  exposureNotional: 0,
  exposurePercent: 0,
  openRiskAmount: 0,
  openRiskPercent: 0,
  openPositionsCount: 0,
  todayTradesCount: 0,
  maxDailyTrades: 5,
  equityHistory: [],
  drawdownHistory: [],
  dailyPnlHistory: [],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('cockpit');
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC');
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  // App State from server
  const [portfolio, setPortfolio] = useState<PortfolioState>(INITIAL_PORTFOLIO);
  const [agentState, setAgentState] = useState<{
    state: string;
    currentAsset: string | null;
    lastCycleAt: number;
    conviction: number;
  }>({
    state: 'SCANNING',
    currentAsset: 'BTC',
    lastCycleAt: Date.now(),
    conviction: 84,
  });
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [openPositions, setOpenPositions] = useState<Position[]>([]);
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>([]);
  const [aiDecisions, setAiDecisions] = useState<AIDecision[]>([]);
  const [activities, setActivities] = useState<AIActivityItem[]>([]);
  const [radar, setRadar] = useState<AssetSummary[]>([]);
  const [regime, setRegime] = useState<MarketRegime>('RISK-ON');

  // Fetch core state
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data.portfolio);
        setAgentState(data.agentState);
        setSettings(data.settings);
        setOpenPositions(data.openPositions || []);
        setClosedTrades(data.closedTrades || []);
        setAiDecisions(data.aiDecisions || []);
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error('Error fetching state snapshot:', err);
    }
  }, []);

  // Fetch opportunity radar
  const fetchRadar = useCallback(async () => {
    try {
      const res = await fetch('/api/market/radar');
      if (res.ok) {
        const data = await res.json();
        setRadar(data);
      }
    } catch (err) {
      console.error('Error fetching radar:', err);
    }
  }, []);

  // Fetch regime
  const fetchRegime = useCallback(async () => {
    try {
      const res = await fetch('/api/macro/regime');
      if (res.ok) {
        const data = await res.json();
        if (data.regime) {
          setRegime(data.regime);
        }
      }
    } catch (err) {
      console.error('Error fetching regime:', err);
    }
  }, []);

  useEffect(() => {
    fetchState();
    fetchRadar();
    fetchRegime();

    // Regular polling for real-time responsiveness
    const stateInterval = setInterval(fetchState, 3500);
    const radarInterval = setInterval(fetchRadar, 8000);
    const regimeInterval = setInterval(fetchRegime, 25000);

    return () => {
      clearInterval(stateInterval);
      clearInterval(radarInterval);
      clearInterval(regimeInterval);
    };
  }, [fetchState, fetchRadar, fetchRegime]);

  const handleTriggerCycle = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch('/api/agent/trigger-cycle', { method: 'POST' });
      if (res.ok) {
        await fetchState();
        await fetchRadar();
      }
    } catch (err) {
      console.error('Error triggering autonomous cycle:', err);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleToggleAutonomous = async () => {
    try {
      const res = await fetch('/api/agent/toggle', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, isAutonomousActive: data.isAutonomousActive }));
        await fetchState();
      }
    } catch (err) {
      console.error('Error toggling autonomous loop:', err);
    }
  };

  const handleClosePosition = async (id: string) => {
    try {
      const res = await fetch(`/api/trades/close/${id}`, { method: 'POST' });
      if (res.ok) {
        await fetchState();
      }
    } catch (err) {
      console.error('Error closing position:', err);
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
      }
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };

  const handleResetPortfolio = async () => {
    try {
      const res = await fetch('/api/settings/reset-portfolio', { method: 'POST' });
      if (res.ok) {
        await fetchState();
        setIsSettingsOpen(false);
      }
    } catch (err) {
      console.error('Error resetting portfolio:', err);
    }
  };

  const handleSelectAsset = (asset: string) => {
    setSelectedAsset(asset);
    setActiveTab('intelligence');
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Header */}
      <Header
        settings={settings}
        agentState={agentState}
        regime={regime}
        todayTradesCount={portfolio.todayTradesCount}
        maxDailyTrades={settings.maxDailyTrades}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTriggerCycle={handleTriggerCycle}
        onToggleAutonomous={handleToggleAutonomous}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHealth={() => setIsHealthOpen(true)}
        isTriggering={isTriggering}
      />

      {/* Portfolio Quick Bar */}
      <PortfolioStats portfolio={portfolio} />

      {/* Main Workspace Tabs */}
      <main className="flex-1 flex flex-col min-h-0">
        {(activeTab === 'cockpit' || activeTab === 'operations') && (
          <UnifiedTradingDesk
            agentState={agentState}
            radar={radar}
            openPositions={openPositions}
            closedTrades={closedTrades}
            aiDecisions={aiDecisions}
            activities={activities}
            regime={regime}
            onOpenJournal={(id) => setSelectedJournalId(id)}
            onClosePosition={handleClosePosition}
            onTriggerCycle={handleTriggerCycle}
            isTriggering={isTriggering}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenHealth={() => setIsHealthOpen(true)}
          />
        )}

        {activeTab === 'intelligence' && (
          <AssetIntelligenceDesk
            initialAsset={selectedAsset}
            onTradeSubmitted={() => {
              fetchState();
              setActiveTab('cockpit');
            }}
          />
        )}

        {activeTab === 'macro' && <MacroEventsHub />}

        {activeTab === 'ledger' && (
          <TradeLedger
            closedTrades={closedTrades}
            openPositions={openPositions}
            onOpenJournal={(id) => setSelectedJournalId(id)}
          />
        )}

        {activeTab === 'backtest' && <BacktestLab />}
      </main>

      {/* Trade Journal Modal */}
      <TradeJournalModal
        tradeId={selectedJournalId}
        onClose={() => setSelectedJournalId(null)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetPortfolio={handleResetPortfolio}
      />

      {/* System Health Modal */}
      <SystemHealthModal
        isOpen={isHealthOpen}
        onClose={() => setIsHealthOpen(false)}
      />
    </div>
  );
}
