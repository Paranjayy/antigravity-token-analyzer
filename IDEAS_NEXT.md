# Ideas Next

This file tracks the next practical upgrades for the analyzer.

## Product Ideas

- Add a dedicated Codex drilldown view with thread-level charts, model split, and prompt-length trends.
- Support imported archives from more tools, especially `.json`, `.jsonl`, `.md`, and plain text exports.
- Add session search and saved filters so you can jump between projects, models, and date ranges quickly.
- Show “cost per session”, “tokens per prompt”, and “tokens per tool call” as secondary insights.
- Add a compact compare mode for Antigravity vs OpenCode vs Codex.

## Data Ideas

- Store parsed snapshots separately from the UI bundle so re-analysis does not depend on rebuilding the app.
- Add smarter deduplication rules for telemetry-heavy sources that repeat the same event across multiple log targets.
- Track model families and pricing changes over time, not just the latest pricing snapshot.
- Add optional CSV export for the summary tables.

## UX Ideas

- Add a calm “focus mode” view with just three metrics and one chart.
- Add a session detail drawer instead of packing all details into the main page.
- Add empty-state hints that explain where each source is stored locally.
- Add a tiny “last analyzed” badge and a re-scan button with progress state.

