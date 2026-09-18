import React from 'react';
import {
  Activity,
  Cpu,
  Flame,
  Globe,
  Play,
  Pause,
  RotateCw,
  Settings as SettingsIcon,
  Shield,
  Zap,
} from 'lucide-react';
import { AppSettings, MarketRegime } from '../types.js';

interface HeaderProps {
  settings: AppSettings;
  agentState: {
    state: string;
    currentAsset: string | null;
    lastCycleAt: number;
    conviction: number;
  };
  regime: MarketRegime;
  todayTradesCount: number;
  maxDailyTrades: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onTriggerCycle: () => void;
  onToggleAutonomous: () => void;
  onOpenSettings: () => void;
  onOpenHealth: () => void;
  isTriggering: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  agentState,
  regime,
  todayTradesCount,
  maxDailyTrades,
  activeTab,
  setActiveTab,
  onTriggerCycle,
  onToggleAutonomous,
  onOpenSettings,
  onOpenHealth,
  isTriggering,
}) => {
  const getRegimeBadge = () => {
    switch (regime) {
      case 'RISK-ON':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'RISK-OFF':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'TRANSITION':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getAgentStateColor = () => {
    switch (agentState.state) {
      case 'EXECUTING':
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40';
      case 'RISK CHECK':
        return 'text-amber-400 border-amber-500/40 bg-amber-950/40';
      case 'ANALYZING EVENT':
      case 'CROSS-CHECKING':
        return 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40';
      case 'SCANNING':
        return 'text-blue-400 border-blue-500/40 bg-blue-950/40';
      case 'MONITORING':
        return 'text-violet-400 border-violet-500/40 bg-violet-950/40';
      default:
        return 'text-slate-400 border-slate-800 bg-slate-900/60';
    }
  };

  const navItems = [
    { id: 'cockpit', label: 'PRO COCKPIT', icon: Activity },
    { id: 'macro', label: 'MACRO TRANSMISSION', icon: Globe },
    { id: 'ledger', label: 'AUDIT LEDGER', icon: Shield },
    { id: 'backtest', label: 'STRATEGY & RISK LAB', icon: Zap },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-[#0d121c]/95 backdrop-blur-md sticky top-0 z-40">
      {/* Top Banner: Operational Mode & Guardrails */}
      <div className="px-4 py-1.5 bg-[#090d14] border-b border-slate-900 flex flex-wrap items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            MODE: {settings.tradingMode}
          </span>
          <span className="hidden sm:inline text-slate-400">
            Real market prices & news • Deterministic 20-rule risk gate • Zero real capital risk
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <button
            onClick={onOpenHealth}
            id="btn-network-status"
            className="hover:text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="System & API Health Diagnostics"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-[11px]">DATA PIPELINES: HEALTHY</span>
          </button>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-[11px]">
            <span>TODAY:</span>
            <span className="text-amber-400 font-bold">
              {todayTradesCount}/{maxDailyTrades}
            </span>
            <span className="text-slate-500">TRADES</span>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & State */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 p-[1px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#0b0e14] rounded-lg flex items-center justify-center">
                <Flame className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-bold tracking-wider text-white">
                  MACROVEX
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  2.1 PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight">
                AUTONOMOUS MACRO TRADING DESK
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800">
            {/* Live Agent State Indicator */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono font-semibold ${getAgentStateColor()}`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              <span>AGENT: {agentState.state}</span>
              {agentState.currentAsset && (
                <span className="text-white bg-black/40 px-1.5 py-0.5 rounded text-[11px]">
                  [{agentState.currentAsset}]
                </span>
              )}
            </div>

            {/* Regime Badge */}
            <div
              className={`px-2.5 py-1.5 rounded border text-xs font-mono font-semibold ${getRegimeBadge()}`}
            >
              REGIME: {regime}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={onToggleAutonomous}
            id="btn-toggle-agent"
            className={`px-3 py-1.5 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              settings.isAutonomousActive
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
            }`}
          >
            {settings.isAutonomousActive ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                AUTONOMOUS: ACTIVE
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                AUTONOMOUS: PAUSED
              </>
            )}
          </button>

          <button
            onClick={onTriggerCycle}
            id="btn-trigger-cycle"
            disabled={isTriggering}
            className="px-3 py-1.5 rounded text-xs font-mono font-semibold bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Force immediate macro scan & analysis cycle"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">RUN CYCLE NOW</span>
          </button>

          <button
            onClick={onOpenSettings}
            id="btn-settings"
            className="p-2 rounded text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            title="Trading Mode & Risk Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="px-4 flex items-center gap-1 overflow-x-auto border-t border-slate-800/60 no-scrollbar">
        {navItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-display font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-cyan-400 border-cyan-400 bg-cyan-500/5'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
