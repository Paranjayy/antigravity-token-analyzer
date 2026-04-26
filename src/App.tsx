/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Brain,
  Briefcase,
  Calendar,
  ChevronRight,
  Code2,
  Cpu,
  Download,
  FolderOpen,
  Flame,
  Layers,
  LineChart,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { motion } from 'framer-motion';
import stats from './data/stats.json';

const SOURCE_COLORS = {
  antigravity: '#e879f9',
  opencode: '#f59e0b',
  codex: '#22c55e',
  all: '#38bdf8'
};

const MODEL_COLORS = ['#7dd3fc', '#c084fc', '#fda4af', '#fbbf24', '#86efac', '#fb7185'];

const tabs = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'sessions', label: 'Sessions', icon: MessageSquareText },
  { id: 'engineering', label: 'Engineering', icon: Code2 },
  { id: 'models', label: 'Models', icon: Brain }
] as const;

type TabId = (typeof tabs)[number]['id'];
type RangeId = 'all' | '30' | '7';
type SourceId = 'all' | 'antigravity' | 'opencode' | 'codex';

const formatNumber = (value: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
const formatPlain = (value: number) => new Intl.NumberFormat('en-US').format(value);
const formatMoney = (value: number) => `$${value.toFixed(2)}`;

const sourceLabel = (source: SourceId) => {
  if (source === 'antigravity') return 'Antigravity';
  if (source === 'opencode') return 'OpenCode';
  if (source === 'codex') return 'Codex';
  return 'All Sources';
};

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [currentStats, setCurrentStats] = useState<any>(stats);
  const [dateRange, setDateRange] = useState<RangeId>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceId>('all');

  const handleDownload = () => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(currentStats, null, 2))}`;
    const anchor = document.createElement('a');
    anchor.href = dataStr;
    anchor.download = `antigravity_stats_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(String(e.target?.result || '{}'));
        setCurrentStats(json);
      } catch {
        alert('That file is not a valid stats payload.');
      }
    };
    reader.readAsText(file);
  };

  const filteredTimeline = useMemo(() => {
    const now = Date.now();
    return (currentStats.timelineArray || []).filter((day: any) => {
      if (dateRange === 'all') return true;
      const ageDays = (now - new Date(day.date).getTime()) / (1000 * 60 * 60 * 24);
      return ageDays <= Number(dateRange);
    });
  }, [currentStats, dateRange]);

  const timelineChart = useMemo(() => {
    return filteredTimeline.map((day: any) => ({
      ...day,
      dateLabel: day.date.slice(5).replace('-', '/'),
      input: sourceFilter === 'antigravity' ? day.ag_input || 0 : sourceFilter === 'opencode' ? day.oc_input || 0 : sourceFilter === 'codex' ? day.cx_input || 0 : day.input || 0,
      output: sourceFilter === 'antigravity' ? day.ag_output || 0 : sourceFilter === 'opencode' ? day.oc_output || 0 : sourceFilter === 'codex' ? day.cx_output || 0 : day.output || 0,
      cost: sourceFilter === 'antigravity' ? day.ag_cost || 0 : sourceFilter === 'opencode' ? day.oc_cost || 0 : sourceFilter === 'codex' ? day.cx_cost || 0 : day.cost || 0,
      tools: day.tools || 0
    }));
  }, [filteredTimeline, sourceFilter]);

  const overview = useMemo(() => {
    return timelineChart.reduce(
      (acc: any, day: any) => {
        acc.input += day.input || 0;
        acc.output += day.output || 0;
        acc.cost += day.cost || 0;
        acc.tools += day.tools || 0;
        acc.inputMessages += day.inputMessages || 0;
        acc.outputMessages += day.outputMessages || 0;
        return acc;
      },
      { input: 0, output: 0, cost: 0, tools: 0, inputMessages: 0, outputMessages: 0 }
    );
  }, [timelineChart]);

  const providers = useMemo(() => {
    const base = currentStats.providers || {};
    return [
      {
        id: 'antigravity' as const,
        label: 'Antigravity',
        ...base.antigravity,
        color: SOURCE_COLORS.antigravity
      },
      {
        id: 'opencode' as const,
        label: 'OpenCode',
        ...base.opencode,
        color: SOURCE_COLORS.opencode
      },
      {
        id: 'codex' as const,
        label: 'Codex',
        ...base.codex,
        color: SOURCE_COLORS.codex
      }
    ];
  }, [currentStats]);

  const modelRows = useMemo(() => {
    return Object.entries(currentStats.models || {})
      .filter(([, model]: any) => sourceFilter === 'all' || model.source === sourceFilter)
      .map(([name, model]: any) => ({
        name,
        source: model.source || 'unknown',
        tokens: model.tokens || 0,
        sessions: model.sessions || 0,
        cost: model.cost || 0
      }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 8);
  }, [currentStats, sourceFilter]);

  const projectRows = useMemo(() => {
    return Object.entries(currentStats.projects || {})
      .map(([name, project]: any) => ({
        name,
        ...project,
        totalTokens: (project.tokens?.input || 0) + (project.tokens?.output || 0)
      }))
      .sort((a, b) => b.totalTokens - a.totalTokens)
      .slice(0, 8);
  }, [currentStats]);

  const toolRows = useMemo(() => {
    return Object.entries(currentStats.toolUsage || {})
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count: Number(count) }));
  }, [currentStats]);

  const sessions = useMemo(() => {
    return (currentStats.topConversations || [])
      .filter((session: any) => sourceFilter === 'all' || session.source === sourceFilter)
      .slice(0, 12);
  }, [currentStats, sourceFilter]);

  const heroTitle = sourceFilter === 'all' ? 'Analyzer Console' : `${sourceLabel(sourceFilter)} Console`;
  const totalSessions = (currentStats.conversations || 0).toLocaleString();
  const totalTokens = formatNumber((currentStats.totalTokens?.input || 0) + (currentStats.totalTokens?.output || 0));
  const totalCost = formatMoney(currentStats.totalCost || 0);
  const modelCount = Object.keys(currentStats.models || {}).length;
  const toolCount = Object.values(currentStats.toolUsage || {}).reduce((sum: number, count: any) => sum + Number(count || 0), 0);
  const errorCount =
    (currentStats.providers?.antigravity?.errors || 0) +
    (currentStats.providers?.opencode?.errors || 0) +
    (currentStats.providers?.codex?.errors || 0);

  const chartInputColor = sourceFilter === 'all' ? '#7dd3fc' : SOURCE_COLORS[sourceFilter];
  const chartOutputColor = sourceFilter === 'all' ? '#f472b6' : '#f59e0b';

  return (
    <div className="min-h-screen text-[var(--color-foreground)]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-28 right-[-8rem] h-80 w-80 rounded-full bg-[color-mix(in_oklab,var(--color-primary)_20%,transparent)] blur-3xl" />
        <div className="absolute left-[-6rem] top-32 h-72 w-72 rounded-full bg-[color-mix(in_oklab,var(--color-accent)_22%,transparent)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,transparent_70%,color-mix(in_oklab,var(--color-background)_90%,white)_100%)] opacity-60" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-4 md:px-6 lg:px-8">
        <header className="sticky top-4 z-20 mb-6 rounded-3xl border border-[var(--color-border)]/80 bg-[color-mix(in_oklab,var(--color-card)_82%,transparent)] px-4 py-4 shadow-[0_20px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl md:px-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-primary)_16%,transparent)] text-[var(--color-primary)]">
                <Cpu size={20} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[var(--color-muted-foreground)]">Local AI usage atlas</p>
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{heroTitle}</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-full border border-[var(--color-border)] bg-[var(--color-background)] p-1">
                {( ['all', 'antigravity', 'opencode', 'codex'] as SourceId[] ).map((source) => (
                  <button
                    key={source}
                    onClick={() => setSourceFilter(source)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      sourceFilter === source
                        ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                        : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                    }`}
                  >
                    {sourceLabel(source)}
                  </button>
                ))}
              </div>

              <div className="flex rounded-full border border-[var(--color-border)] bg-[var(--color-background)] p-1">
                {( ['all', '30', '7'] as RangeId[] ).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      dateRange === range
                        ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                        : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                    }`}
                  >
                    {range === 'all' ? 'All time' : `${range}d`}
                  </button>
                ))}
              </div>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs font-medium text-[var(--color-muted-foreground)] transition hover:text-[var(--color-foreground)]">
                <FolderOpen size={14} />
                Import JSON
                <input type="file" className="hidden" accept=".json" onChange={handleUpload} />
              </label>

              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs font-medium text-[var(--color-muted-foreground)] transition hover:text-[var(--color-foreground)]"
              >
                <Download size={14} />
                Export
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition ${
                    activeTab === tab.id
                      ? 'border-[var(--color-border)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                      : 'border-[var(--color-border)] bg-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        <main className="flex-1 pb-8">
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="mb-6 grid gap-4 lg:grid-cols-[1.45fr_0.55fr]"
          >
            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_88%,transparent)] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.16)]">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                  <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                    <Sparkles size={12} />
                    Tastefully condensed telemetry
                  </p>
                  <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
                    One clean place for Antigravity, OpenCode, and saved chat archives.
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--color-muted-foreground)] md:text-base">
                    The dashboard now prioritizes signal over spectacle: real session counts, real model IDs, real costs, and a smaller set of well-balanced panels.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 md:min-w-[320px]">
                  {[
                    { label: 'Sessions', value: totalSessions, icon: MessageSquareText },
                    { label: 'Models', value: formatPlain(modelCount), icon: Brain },
                    { label: 'Tools', value: formatPlain(toolCount), icon: Terminal },
                    { label: 'Errors', value: formatPlain(errorCount), icon: ShieldCheck }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-muted-foreground)]">{item.label}</span>
                          <Icon size={14} className="text-[var(--color-muted-foreground)]" />
                        </div>
                        <div className="mt-4 text-2xl font-semibold tracking-tight">{item.value}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_88%,transparent)] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">Snapshot</p>
                  <h3 className="mt-1 text-lg font-semibold tracking-tight">Current view</h3>
                </div>
                <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1 text-xs text-[var(--color-muted-foreground)]">
                  {sourceLabel(sourceFilter)}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-[var(--color-muted-foreground)]">Tokens</span>
                    <span className="font-medium">{totalTokens}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--color-muted)]">
                    <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: '88%' }} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-[var(--color-muted-foreground)]">Spend</span>
                    <span className="font-medium">{totalCost}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--color-muted)]">
                    <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: '64%' }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-muted-foreground)]">Input msgs</div>
                    <div className="mt-2 text-xl font-semibold">{formatPlain(overview.inputMessages)}</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-muted-foreground)]">Output msgs</div>
                    <div className="mt-2 text-xl font-semibold">{formatPlain(overview.outputMessages)}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="space-y-6"
            >
              <section className="grid gap-4 lg:grid-cols-4">
                {[
                  {
                    label: 'Total cost',
                    value: totalCost,
                    note: `${formatPlain(overview.cost)} filtered cost`,
                    icon: Brain
                  },
                  {
                    label: 'Combined tokens',
                    value: totalTokens,
                    note: `${formatPlain(overview.input)} input / ${formatPlain(overview.output)} output`,
                    icon: Zap
                  },
                  {
                    label: 'Tool calls',
                    value: formatPlain(overview.tools),
                    note: `${formatPlain(toolCount)} total across workspace`,
                    icon: Terminal
                  },
                  {
                    label: 'Sessions',
                    value: totalSessions,
                    note: `${sourceLabel(sourceFilter)} only`,
                    icon: Activity
                  }
                ].map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div
                      key={metric.label}
                      className="rounded-[1.75rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_88%,transparent)] p-5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-muted-foreground)]">{metric.label}</span>
                        <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-[var(--color-foreground)]">
                          <Icon size={14} />
                        </div>
                      </div>
                      <div className="mt-4 text-3xl font-semibold tracking-tight">{metric.value}</div>
                      <div className="mt-2 text-xs text-[var(--color-muted-foreground)]">{metric.note}</div>
                    </div>
                  );
                })}
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.5fr_0.75fr]">
                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_88%,transparent)] p-6">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">Usage over time</p>
                      <h3 className="mt-1 text-xl font-semibold tracking-tight">Daily input and output flow</h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--color-muted-foreground)]">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartInputColor }} />
                        Input
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartOutputColor }} />
                        Output
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timelineChart}>
                        <defs>
                          <linearGradient id="inputFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartInputColor} stopOpacity={0.28} />
                            <stop offset="95%" stopColor={chartInputColor} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="outputFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartOutputColor} stopOpacity={0.24} />
                            <stop offset="95%" stopColor={chartOutputColor} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.35} vertical={false} />
                        <XAxis
                          dataKey="dateLabel"
                          stroke="var(--color-muted-foreground)"
                          tickLine={false}
                          axisLine={false}
                          fontSize={11}
                          minTickGap={24}
                        />
                        <YAxis hide />
                        <Tooltip
                          cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
                          contentStyle={{
                            backgroundColor: 'var(--color-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '16px',
                            color: 'var(--color-foreground)'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="input"
                          stroke={chartInputColor}
                          strokeWidth={2.5}
                          fill="url(#inputFill)"
                          name="Input"
                        />
                        <Area
                          type="monotone"
                          dataKey="output"
                          stroke={chartOutputColor}
                          strokeWidth={2.5}
                          fill="url(#outputFill)"
                          name="Output"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-[2rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_88%,transparent)] p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">Source split</p>
                        <h3 className="mt-1 text-lg font-semibold tracking-tight">Antigravity vs OpenCode</h3>
                      </div>
                      <BarChart3 size={16} className="text-[var(--color-muted-foreground)]" />
                    </div>

                    <div className="mt-6 space-y-4">
                      {providers.map((provider) => {
                        const totalProviderTokens = (provider.tokens?.input || 0) + (provider.tokens?.output || 0);
                        const share = (totalProviderTokens / Math.max(overview.input + overview.output, 1)) * 100;
                        return (
                          <div key={provider.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="text-sm font-medium">{provider.label}</div>
                                <div className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                                  {formatPlain(totalProviderTokens)} tokens · {formatMoney(provider.cost || 0)}
                                </div>
                              </div>
                              <div className="text-right text-xs text-[var(--color-muted-foreground)]">
                                <div>{formatPlain(provider.conversations || 0)} sessions</div>
                                <div>{formatPlain(provider.errors || 0)} errors</div>
                              </div>
                            </div>
                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-muted)]">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.max(8, share)}%`, backgroundColor: provider.color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_88%,transparent)] p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">Signal</p>
                        <h3 className="mt-1 text-lg font-semibold tracking-tight">Model coverage</h3>
                      </div>
                      <Layers size={16} className="text-[var(--color-muted-foreground)]" />
                    </div>
                    <div className="mt-4 text-3xl font-semibold tracking-tight">{modelCount}</div>
                    <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                      Distinct model IDs detected across the filtered source set.
                    </p>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'sessions' && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]"
            >
              <section className="rounded-[2rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_88%,transparent)] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">Top sessions</p>
                    <h3 className="mt-1 text-xl font-semibold tracking-tight">Largest conversations by token load</h3>
                  </div>
                  <Briefcase size={16} className="text-[var(--color-muted-foreground)]" />
                </div>

                <div className="mt-6 space-y-3">
                  {sessions.map((session: any) => (
                    <div
                      key={session.id}
                      className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 transition hover:border-[var(--color-foreground)]/40"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
                              {formatPlain(session.tokens || 0)} tokens
                            </span>
                            <span
                              className="rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.28em]"
                              style={{
                                backgroundColor: `${SOURCE_COLORS[session.source as keyof typeof SOURCE_COLORS] || SOURCE_COLORS.all}15`,
                                color: SOURCE_COLORS[session.source as keyof typeof SOURCE_COLORS] || SOURCE_COLORS.all
                              }}
                            >
                              {sourceLabel(session.source as SourceId)}
                            </span>
                            {session.model && (
                              <span className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
                                {session.model}
                              </span>
                            )}
                          </div>

                          <h4 className="mt-3 truncate text-lg font-semibold tracking-tight">{session.title}</h4>
                          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[var(--color-muted-foreground)]">
                            <span className="inline-flex items-center gap-1.5">
                              <Briefcase size={12} />
                              {session.project || 'General'}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar size={12} />
                              {session.date || 'unknown'}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Terminal size={12} />
                              {formatPlain(session.tools || 0)} tools
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <ShieldCheck size={12} />
                              {formatPlain(session.errors || 0)} errors
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">Cost</div>
                            <div className="mt-1 text-lg font-semibold">{formatMoney(session.cost || 0)}</div>
                          </div>
                          <ChevronRight size={18} className="text-[var(--color-muted-foreground)] transition group-hover:translate-x-1 group-hover:text-[var(--color-foreground)]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-6">
                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_88%,transparent)] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">Recent activity</p>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight">Latest sessions in this view</h3>
                    </div>
                    <Flame size={16} className="text-[var(--color-muted-foreground)]" />
                  </div>
                  <div className="mt-5 space-y-3">
                    {(currentStats.recentActivity || [])
                      .filter((session: any) => sourceFilter === 'all' || session.source === sourceFilter)
                      .slice(0, 6)
                      .map((session: any) => (
                        <div key={session.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">{session.title}</div>
                              <div className="mt-1 text-xs text-[var(--color-muted-foreground)]">{session.project || 'General'} · {session.date || 'unknown'}</div>
                            </div>
                            <div className="text-right text-xs text-[var(--color-muted-foreground)]">
                              <div>{formatPlain(session.tokens || 0)} tokens</div>
                              <div>{formatMoney(session.cost || 0)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'engineering' && (
            <motion.div
              key="engineering"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]"
            >
              <section className="rounded-[2rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_88%,transparent)] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">Engineering</p>
                    <h3 className="mt-1 text-xl font-semibold tracking-tight">Files and code churn</h3>
                  </div>
                  <Code2 size={16} className="text-[var(--color-muted-foreground)]" />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Files touched', value: formatPlain(currentStats.engineering?.filesAffected || 0) },
                    { label: 'LOC written', value: formatPlain(currentStats.engineering?.totalLOC || 0) },
                    { label: 'Summary files', value: formatPlain(currentStats.engineering?.summaryFiles || 0) },
                    { label: 'Tools/session', value: (currentStats.engineering?.toolsPerSession || 0).toFixed(1) }
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">{item.label}</div>
                      <div className="mt-3 text-2xl font-semibold tracking-tight">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  {projectRows.map((project: any) => (
                    <div key={project.name} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{project.name}</div>
                          <div className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                            {formatPlain(project.sessions || 0)} sessions · {formatPlain(project.tools || 0)} tools
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatMoney(project.cost || 0)}</div>
                          <div className="text-xs text-[var(--color-muted-foreground)]">{formatPlain(project.totalTokens || 0)} tokens</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_88%,transparent)] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">Protocol execution</p>
                    <h3 className="mt-1 text-xl font-semibold tracking-tight">Most used tools</h3>
                  </div>
                  <Terminal size={16} className="text-[var(--color-muted-foreground)]" />
                </div>

                <div className="mt-6 space-y-3">
                  {toolRows.map((tool, index) => (
                    <div key={tool.name} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{tool.name}</div>
                          <div className="mt-1 text-xs text-[var(--color-muted-foreground)]">Execution frequency</div>
                        </div>
                        <div className="text-sm font-medium">{formatPlain(tool.count)}</div>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-muted)]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(8, (tool.count / Math.max(toolRows[0]?.count || 1, 1)) * 100)}%`,
                            backgroundColor: MODEL_COLORS[index % MODEL_COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'models' && (
            <motion.div
              key="models"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="grid gap-6 xl:grid-cols-[1fr_0.95fr]"
            >
              <section className="rounded-[2rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_88%,transparent)] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">Models</p>
                    <h3 className="mt-1 text-xl font-semibold tracking-tight">Usage by model ID</h3>
                  </div>
                  <Brain size={16} className="text-[var(--color-muted-foreground)]" />
                </div>

                <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[var(--color-border)]">
                  <div className="grid grid-cols-[1.8fr_0.6fr_0.5fr_0.6fr] border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
                    <div>Model</div>
                    <div>Source</div>
                    <div className="text-right">Sessions</div>
                    <div className="text-right">Tokens</div>
                  </div>
                  <div className="divide-y divide-[var(--color-border)]">
                    {modelRows.map((model: any, index: number) => (
                      <div key={model.name} className="grid grid-cols-[1.8fr_0.6fr_0.5fr_0.6fr] items-center bg-[var(--color-background)] px-4 py-4">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{model.name}</div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-muted)]">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.max(10, (model.tokens / Math.max(modelRows[0]?.tokens || 1, 1)) * 100)}%`, backgroundColor: MODEL_COLORS[index % MODEL_COLORS.length] }}
                            />
                          </div>
                        </div>
                        <div className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted-foreground)]">{model.source}</div>
                        <div className="text-right text-sm font-medium">{formatPlain(model.sessions || 0)}</div>
                        <div className="text-right text-sm font-medium">{formatPlain(model.tokens || 0)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_88%,transparent)] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">Provider balance</p>
                    <h3 className="mt-1 text-xl font-semibold tracking-tight">Tokens, spend, and errors</h3>
                  </div>
                  <LineChart size={16} className="text-[var(--color-muted-foreground)]" />
                </div>

                <div className="mt-6 h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={providers}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.35} vertical={false} />
                      <XAxis dataKey="label" stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '16px',
                          color: 'var(--color-foreground)'
                        }}
                      />
                      <Bar dataKey="cost" fill="var(--color-primary)" radius={[12, 12, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </motion.div>
          )}
        </main>

        <footer className="mt-4 rounded-[2rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_82%,transparent)] px-5 py-4 text-sm text-[var(--color-muted-foreground)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="inline-flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]">
                <Cpu size={16} />
              </div>
              <div>
                <div className="font-medium text-[var(--color-foreground)]">Antigravity Token Analyzer</div>
                <div className="text-xs">Local-only dashboard for Antigravity, OpenCode, and imported chat stats.</div>
              </div>
            </div>
            <div className="text-xs uppercase tracking-[0.24em]">{new Date().getFullYear()} · Paranjay</div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
