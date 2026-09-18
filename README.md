MacroVex 2.1 Pro

Cross-Asset AI Trading & Market Intelligence

MacroVex 2.1 Pro is an AI-powered cross-asset trading desk connecting
crypto, equities, commodities, macroeconomic events, financial news,
technical analysis, and market structure into one decision workflow.

Read the market as a system, not as a single chart.

Core Architecture

Real News + Macro Events
          ↓
Event & Catalyst Engine
          ↓
Bitget MCP Live Market Data
          ↓
Cross-Asset Confirmation
          ↓
Technical Analysis + SMC
          ↓
Market Regime
          ↓
AI Decision Engine
          ↓
Deterministic Risk Engine
          ↓
Paper / Demo Execution
          ↓
Position Monitoring
          ↓
Trade Journal & Analytics

Key Features

Bitget Live Market Intelligence

Bitget MCP is the primary live market-data layer. MacroVex can consume
price, 24h change, high/low, volume, bid/ask, spread, mark/index price,
funding, open interest, order book, and candles where supported.

No live Bitget data = no fabricated live price.

If the feed is unavailable, MacroVex shows BITGET MCP OFFLINE /
DATA UNAVAILABLE rather than fake or hardcoded values.

Cross-Asset Coverage

Supported and dynamically resolvable instruments can include:

Crypto: BTC, ETH, SOL, XRP, BNB, DOGE, ADA, AVAX, LINK, SUI, ZEC

Equities / stock instruments: NVDA, AAPL, MSFT, AMZN, META,
GOOGL, TSLA, AMD, AVGO, QQQ, SPY

Commodities: Gold/XAU, Silver/XAG, Oil/CLUSDT

Macroeconomic Events & Catalysts

MacroVex tracks:

Central banks

Inflation

Employment

GDP / growth

Interest rates

Bonds / yields

FX / USD

Energy

Geopolitics

Regulation

Equities

Earnings

Commodities

SEC / CFTC

Liquidity and risk events

Primary sources can include the Federal Reserve, BLS, EIA, BEA, U.S.
Treasury, SEC, CFTC, ECB, Bank of England, Bank of Japan, IMF, and World
Bank.

Live Financial & Crypto News

The news layer can monitor crypto, equities, company announcements,
earnings, AI/semiconductor news, regulation, SEC developments, gold,
silver, oil, geopolitics, central banks, inflation, employment, and
energy.

Every news/event record retains its original source URL and provides
an OPEN ORIGINAL SOURCE ↗ action. Fabricated headlines, timestamps,
summaries, and URLs are not allowed.

News → Market Reaction

MacroVex connects:

News / Event
→ Classification
→ Affected Assets
→ Bitget Live Reaction
→ Cross-Asset Confirmation
→ Technical Structure
→ AI Interpretation

Technical Analysis & SMC

Indicators include EMA20/50/200, RSI14, MACD, ADX14, VWAP, volume,
support/resistance, and multi-timeframe structure.

SMC tools include Order Blocks, Fair Value Gaps, Liquidity Sweeps, BOS,
CHoCH, HH, HL, LH, and LL.

Charting and TA use the same resolved Bitget candle dataset.

AI Decision Engine

The AI combines:

Macro + News + Bitget Market Data
+ Technicals + SMC + Liquidity
+ Cross-Asset Confirmation + Market Regime

Possible decisions are BUY, SELL, WAIT. AI output cannot bypass the
deterministic Risk Engine.

Deterministic Risk Engine

Risk checks include minimum R, stop/target validity, position sizing,
leverage, daily trade limits, open positions, portfolio/correlated
exposure, drawdown, daily loss, volatility, liquidity, spread, funding,
data freshness, instrument availability, macro-event risk, and
liquidation distance.

Minimum R is around 1.5:1, with a preferred strategy target around
2.0--2.1:1.

Paper Trading & Persistent Ledger

MacroVex is designed for paper/demo validation.

Trade lifecycle:

CREATE → OPEN → MONITOR → PARTIAL/FULL EXIT → CLOSE → JOURNAL

Each trade stores entry/exit, quantity, notional, margin, leverage,
SL/TP, R, fees, funding, slippage, P&L, AI decision, risk checks, and
market snapshots.

Every paper trade receives a unique ID such as PAPER-000001.

Trade Journal & Macro Audit

The journal preserves the exact decision context:

Trade details

Macro catalyst

Original news/source URL

Cross-asset snapshot

Technical/SMC snapshot

AI decision snapshot

Risk Engine checks

Execution data

Monitoring data

Exit analysis

Post-mortem

Historical records should be immutable. Data inconsistencies are marked
DATA_INTEGRITY_EXCEPTION rather than silently rewritten.

Stock + rToken Intelligence

For supported stock-token instruments, MacroVex can combine
underlying-stock context, rToken price/liquidity, order book, spread,
premium/discount, QQQ/SPY, sector context, news, and technical analysis.
An rToken is treated as its own tradable instrument rather than
automatically assumed identical to the underlying.

Backtesting

Stock-focused backtesting can include NVDA, AAPL, MSFT, AMZN, META,
GOOGL, TSLA, AMD, AVGO, QQQ, SPY, with BTC, ETH, SOL, BNB, XAU, XAG and
CL as additional markets where historical data exists.

Metrics include return, net P&L, win rate, profit factor, Sharpe,
Sortino, maximum drawdown, average R, holding time, fees, slippage,
event/regime/sector performance.

Historical data is never fabricated.

Data Integrity Rules

Live: Bitget MCP

Historical backtest: historical data provider

Paper execution: fresh validated Bitget market snapshot

These datasets remain separate. Stale data must never be presented as
live.

Security

Keep credentials server-side.

Recommended configuration:

BITGET_API_KEY=
BITGET_API_SECRET=
BITGET_API_PASSPHRASE=
CMC_API_KEY=
NEWS_API_KEY=
BITGET_MODE=demo
TRADING_MODE=PAPER

Never expose credentials in frontend code, client-side environment
variables, GitHub, UI, logs, or AI prompts.

UI Philosophy

MacroVex 2.1 Pro is designed as a professional trading terminal:

Premium dark/light themes

Large central chart workspace

Professional typography

Mature gamification

Interactive market cards

Real-time status indicators

Expandable analytics

Minimal clutter

No childish or excessive cyberpunk styling

Reliability Rules

MacroVex must:

Never fabricate market prices, news, links, or historical data

Never execute WAIT

Never bypass the Risk Engine

Never label stale data as live

Never silently substitute fake data after a feed failure

Never mix live and historical datasets

Never expose API credentials

Preserve auditable trade and event history

Project Status

MacroVex 2.1 Pro is an AI-assisted paper/demo trading and
market-intelligence system designed for cross-asset research,
autonomous decision workflows, controlled execution, and auditable trade
analysis.

Disclaimer

MacroVex is a software and research project. Market data, AI analysis,
paper-trading results, and backtest results do not guarantee future
performance and are not financial advice.

License

N/A
