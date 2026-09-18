import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Calendar,
  Clock,
  ExternalLink,
  Flame,
  Globe,
  Layers,
  Network,
  Radio,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { CrossAssetRelationship, MacroEvent, MarketRegime } from '../types.js';

export const MacroEventsHub: React.FC = () => {
  const [events, setEvents] = useState<MacroEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [regime, setRegime] = useState<{ regime: MarketRegime; confidence: number; drivers: string[]; invalidation: string } | null>(null);
  const [crossAsset, setCrossAsset] = useState<{
    regime: MarketRegime;
    relationships: CrossAssetRelationship[];
    divergences: string[];
    macroTheme: string;
    dollarYieldPressure: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('ALL');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [eventsRes, regimeRes, crossRes] = await Promise.all([
          fetch('/api/macro/events'),
          fetch('/api/macro/regime'),
          fetch('/api/macro/cross-asset'),
        ]);
        if (eventsRes.ok && regimeRes.ok && crossRes.ok) {
          const evData = await eventsRes.json();
          const regData = await regimeRes.json();
          const crData = await crossRes.json();
          setEvents(evData);
          setRegime(regData);
          setCrossAsset(crData);
          if (evData.length > 0) {
            setSelectedEventId(evData[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching macro events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const filteredEvents = events.filter((e) => {
    if (filterCat === 'ALL') return true;
    return e.category === filterCat;
  });

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* 1. Market Regime & Macro Transmission Header */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#0d1424] via-[#10182b] to-[#0c121e] border border-cyan-500/20 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h1 className="font-display text-sm font-bold tracking-wider text-cyan-400">
                GLOBAL MACRO ENVIRONMENT & TRANSMISSION MATRIX
              </h1>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Real economic releases, central bank forward guidance, and multi-asset capital transmission channels.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">CURRENT REGIME: </span>
              <span className="text-emerald-400 font-bold">{regime?.regime || 'RISK-ON'}</span>
              <span className="text-slate-500 text-[10px] ml-1">({regime?.confidence || 85}% conf)</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">DOLLAR / YIELDS: </span>
              <span className="text-cyan-400 font-bold">{crossAsset?.dollarYieldPressure || 'EASING'}</span>
            </div>
          </div>
        </div>

        {/* Invalidation condition notice */}
        {regime && (
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong className="text-slate-300">Regime Invalidation Threshold:</strong> {regime.invalidation}
            </span>
          </div>
        )}
      </div>

      {/* 2. Interactive 5-Stage Event Transmission Engine */}
      {selectedEvent && (
        <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h2 className="font-display text-sm font-bold text-white tracking-wide">
                5-STAGE EVENT TRANSMISSION PIPELINE
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Event: <strong className="text-cyan-300">{selectedEvent.headline}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {/* Stage 1: Event */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">1. CATALYST</span>
                <div className="font-display text-xs font-bold text-white mt-1">
                  {selectedEvent.category}
                </div>
                <p className="text-[11px] text-slate-300 font-mono mt-1 leading-relaxed">
                  {selectedEvent.headline}
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono">
                Source: {selectedEvent.source}
              </div>
            </div>

            {/* Stage 2: Direct Impact */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-blue-400 font-bold">2. DIRECT IMPACT</span>
                <div className="font-display text-xs font-bold text-white mt-1">Rates & Currency</div>
                <p className="text-[11px] text-slate-300 font-mono mt-1 leading-relaxed">
                  {selectedEvent.directImpact || 'Initial rate repricing across short duration curve and FX spreads.'}
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono">
                Duration: Prompt
              </div>
            </div>

            {/* Stage 3: Macro Transmission */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-violet-400 font-bold">3. MACRO CHANNELS</span>
                <div className="font-display text-xs font-bold text-white mt-1">Financial Conditions</div>
                <p className="text-[11px] text-slate-300 font-mono mt-1 leading-relaxed">
                  {selectedEvent.macroTransmission || 'Transmits through discount rate easing and corporate earnings multipliers.'}
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono">
                Channel: Liquidity
              </div>
            </div>

            {/* Stage 4: Asset Response */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold">4. ASSET RESPONSE</span>
                <div className="font-display text-xs font-bold text-white mt-1">Cross-Asset Flows</div>
                <p className="text-[11px] text-slate-300 font-mono mt-1 leading-relaxed">
                  {selectedEvent.assetResponse || 'High beta growth duration assets (Tech, Crypto) exhibit positive price discovery.'}
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono">
                Assets: {selectedEvent.affectedAssets.join(', ')}
              </div>
            </div>

            {/* Stage 5: Trading Implication */}
            <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/40 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">5. TRADING EDGE</span>
                <div className="font-display text-xs font-bold text-white mt-1">Strategy Rule</div>
                <p className="text-[11px] text-cyan-200 font-mono mt-1 leading-relaxed">
                  {selectedEvent.tradingImplication || 'Approved for selective Long continuation on technical swing confirmation.'}
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-cyan-500/20 text-[10px] text-emerald-400 font-mono">
                Validated by Risk Engine
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Live Economic Calendar & News Feed + Cross-Asset Correlation Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Events & News Feed (7 Cols) */}
        <div className="lg:col-span-7 p-4 rounded-xl bg-[#0e1422] border border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <h2 className="font-display text-sm font-bold text-white tracking-wide">
                MACROECONOMIC EVENTS & CATALYSTS
              </h2>
            </div>
            {/* Category Filter */}
            <div className="flex items-center gap-1 font-mono text-[10px] overflow-x-auto no-scrollbar">
              {['ALL', 'CENTRAL_BANK', 'INFLATION', 'EMPLOYMENT', 'ENERGY', 'CRYPTO'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`px-2 py-0.5 rounded cursor-pointer whitespace-nowrap transition-colors ${
                    filterCat === cat
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredEvents.map((ev) => {
              const isSelected = ev.id === selectedEventId;
              const isHigh = ev.importance === 'HIGH';
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  className={`p-3 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/30 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isHigh
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {ev.importance}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                        {ev.category}
                      </span>
                      <span className="text-[10px] text-slate-400">{ev.source}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">
                        {new Date(ev.timestamp).toLocaleDateString()}
                      </span>
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-400 hover:text-cyan-400 p-0.5"
                        title="Open original source article in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <h3 className="font-display text-sm font-bold text-white leading-snug">
                    {ev.headline}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {ev.summary}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <span>Affected Assets:</span>
                      {ev.affectedAssets.map((a) => (
                        <span key={a} className="text-cyan-400 font-bold">
                          {a}
                        </span>
                      ))}
                    </div>
                    {isSelected && (
                      <span className="text-cyan-400 font-bold">● Active in Pipeline</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Cross-Asset Relationship Matrix (5 Cols) */}
        <div className="lg:col-span-5 p-4 rounded-xl bg-[#0e1422] border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-cyan-400" />
                <h2 className="font-display text-sm font-bold text-white tracking-wide">
                  CROSS-ASSET RELATIONSHIPS
                </h2>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">
                Theme: {crossAsset?.macroTheme || 'Expansion'}
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {crossAsset?.relationships.map((rel, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px]">
                      {rel.source} ↔ {rel.target}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                        rel.relationship === 'POSITIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : rel.relationship === 'INVERSE'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {rel.relationship} ({rel.correlation})
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{rel.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Divergences alert box */}
          {crossAsset && crossAsset.divergences.length > 0 && (
            <div className="mt-3 p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs font-mono">
              <div className="font-bold text-amber-300 text-[11px] mb-1 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                NOTABLE CROSS-ASSET DIVERGENCES
              </div>
              <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5">
                {crossAsset.divergences.map((d, idx) => (
                  <li key={idx}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
