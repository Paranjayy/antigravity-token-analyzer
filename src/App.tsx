/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react';
import {
  Activity,
  Brain,
  Briefcase,
  Calendar,
  ChevronRight,
  Code2,
  Cpu,
  Download,
  FolderOpen,
  LineChart,
  MessageSquareText,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { motion } from 'framer-motion';
import stats from './data/stats.json';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Progress } from './components/ui/progress';
import { Separator } from './components/ui/separator';

const SOURCE_COLORS = {
  antigravity: '#e879f9',
  opencode: '#f59e0b',
  codex: '#22c55e',
  all: '#38bdf8'
};

const MODEL_COLORS = ['#a78bfa', '#67e8f9', '#f9a8d4', '#fcd34d', '#86efac', '#fb7185'];

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
      { id: 'antigravity' as const, label: 'Antigravity', ...base.antigravity, color: SOURCE_COLORS.antigravity },
      { id: 'opencode' as const, label: 'OpenCode', ...base.opencode, color: SOURCE_COLORS.opencode },
      { id: 'codex' as const, label: 'Codex', ...base.codex, color: SOURCE_COLORS.codex }
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

  const totalSessions = (currentStats.conversations || 0).toLocaleString();
  const totalTokens = formatNumber((currentStats.totalTokens?.input || 0) + (currentStats.totalTokens?.output || 0));
  const totalCost = formatMoney(currentStats.totalCost || 0);
  const modelCount = Object.keys(currentStats.models || {}).length;
  const toolCount = Object.values(currentStats.toolUsage || {}).reduce((sum: number, count: any) => sum + Number(count || 0), 0);
  const errorCount =
    (currentStats.providers?.antigravity?.errors || 0) +
    (currentStats.providers?.opencode?.errors || 0) +
    (currentStats.providers?.codex?.errors || 0);

  const chartInputColor = sourceFilter === 'all' ? '#a78bfa' : SOURCE_COLORS[sourceFilter];
  const chartOutputColor = sourceFilter === 'all' ? '#f472b6' : '#f59e0b';

  const statCards = [
    { label: 'Sessions', value: totalSessions, icon: MessageSquareText, color: 'oklch(0.72 0.24 290)', glow: 'rgba(139,92,246,0.35)' },
    { label: 'Models', value: formatPlain(modelCount), icon: Brain, color: 'oklch(0.68 0.20 198)', glow: 'rgba(34,211,238,0.35)' },
    { label: 'Tool calls', value: formatPlain(toolCount), icon: Terminal, color: 'oklch(0.78 0.18 75)', glow: 'rgba(251,191,36,0.35)' },
    { label: 'Errors', value: formatPlain(errorCount), icon: ShieldCheck, color: 'oklch(0.74 0.18 155)', glow: 'rgba(52,211,153,0.35)' },
  ];

  return (
    <div className="relative min-h-screen text-[var(--color-foreground)]">
      {/* Ambient blobs — fixed, behind everything */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute -top-40 right-[-10rem] h-96 w-96 rounded-full opacity-50"
          style={{ background: 'radial-gradient(circle, oklch(0.72 0.24 290 / 0.16), transparent 70%)' }} />
        <div className="absolute left-[-8rem] top-60 h-80 w-80 rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, oklch(0.68 0.20 198 / 0.13), transparent 70%)' }} />
        <div className="absolute bottom-20 right-[20%] h-64 w-64 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, oklch(0.65 0.22 340 / 0.12), transparent 70%)' }} />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-4 lg:px-6 lg:py-5" style={{ zIndex: 1 }}>

        {/* ── Sticky Header ── */}
        <header className="sticky top-4 z-30 mb-5">
          <Card>
            <div className="px-5 py-4 lg:px-6">

              {/* Row 1: Brand + Actions */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, oklch(0.72 0.24 290 / 0.22), oklch(0.68 0.20 198 / 0.14))',
                      border: '1px solid oklch(0.72 0.24 290 / 0.32)',
                    }}
                  >
                    <Cpu size={17} style={{ color: 'oklch(0.84 0.18 290)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-[var(--color-muted-foreground)]">
                      Analyzer Console
                    </p>
                    <h1 className="gradient-text-violet text-lg font-bold tracking-tight leading-tight truncate">
                      Antigravity Token Analyzer
                    </h1>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-muted)]/40 px-3 py-1.5 text-[11px] font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]">
                    <FolderOpen size={12} />
                    Import
                    <input type="file" className="hidden" accept=".json" onChange={handleUpload} />
                  </label>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download size={12} />
                    Export
                  </Button>
                </div>
              </div>

              <Separator className="my-3.5 opacity-40" />

              {/* Row 2: Tabs (left) + Filters (right) */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Tab group */}
                <div className="flex items-center gap-1 rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-muted)]/40 p-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150"
                        style={
                          active
                            ? {
                                background: 'linear-gradient(135deg, oklch(0.72 0.24 290), oklch(0.68 0.26 315))',
                                color: 'white',
                                boxShadow: '0 1px 10px oklch(0.72 0.24 290 / 0.4)',
                              }
                            : { color: 'var(--color-muted-foreground)' }
                        }
                      >
                        <Icon size={11} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Filter groups */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Source filter */}
                  <div className="flex items-center gap-1 rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-muted)]/40 p-1">
                    {(['all', 'antigravity', 'opencode', 'codex'] as SourceId[]).map((source) => {
                      const active = sourceFilter === source;
                      return (
                        <button
                          key={source}
                          onClick={() => setSourceFilter(source)}
                          className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all"
                          style={
                            active
                              ? source === 'all'
                                ? {
                                    background: 'linear-gradient(135deg, oklch(0.72 0.24 290), oklch(0.68 0.26 315))',
                                    color: 'white',
                                    boxShadow: '0 1px 10px oklch(0.72 0.24 290 / 0.35)',
                                  }
                                : {
                                    background: `${SOURCE_COLORS[source]}20`,
                                    color: SOURCE_COLORS[source],
                                    border: `1px solid ${SOURCE_COLORS[source]}40`,
                                  }
                              : { color: 'var(--color-muted-foreground)' }
                          }
                        >
                          {sourceLabel(source)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Date range filter */}
                  <div className="flex items-center gap-1 rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-muted)]/40 p-1">
                    {(['all', '30', '7'] as RangeId[]).map((range) => {
                      const active = dateRange === range;
                      return (
                        <button
                          key={range}
                          onClick={() => setDateRange(range)}
                          className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all"
                          style={
                            active
                              ? {
                                  background: 'linear-gradient(135deg, oklch(0.72 0.24 290), oklch(0.68 0.26 315))',
                                  color: 'white',
                                  boxShadow: '0 1px 10px oklch(0.72 0.24 290 / 0.35)',
                                }
                              : { color: 'var(--color-muted-foreground)' }
                          }
                        >
                          {range === 'all' ? 'All time' : `${range}d`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </header>

        {/* ── Stat cards row (always visible) ── */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="p-0">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                        {item.label}
                      </p>
                      <p
                        className="mt-2 text-[1.7rem] font-bold leading-none tracking-tight"
                        style={{ color: item.color }}
                      >
                        {item.value}
                      </p>
                    </div>
                    <div
                      className="ml-3 shrink-0 rounded-xl p-2"
                      style={{ background: `color-mix(in oklab, ${item.color} 14%, transparent)` }}
                    >
                      <Icon size={14} style={{ color: item.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Main content ── */}
        <main className="flex-1 pb-10">

          {/* ── Overview tab ── */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]"
            >
              {/* Chart card */}
              <Card className="overflow-hidden">
                <CardHeader className="px-6 pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Badge variant="soft" className="mb-2.5 w-fit">Usage over time</Badge>
                      <CardTitle className="gradient-text text-2xl font-bold leading-tight">
                        Daily token flow
                      </CardTitle>
                      <CardDescription className="mt-1.5 text-sm">
                        Input &amp; output tokens across all active sources.
                      </CardDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs shrink-0">
                      {[
                        { label: 'Cost', value: totalCost, accent: '#a78bfa' },
                        { label: 'Tokens', value: totalTokens, accent: '#67e8f9' },
                        { label: 'Tools', value: formatPlain(overview.tools), accent: '#fcd34d' },
                        { label: 'Sessions', value: totalSessions, accent: '#f9a8d4' },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-background)]/80 px-3 py-2.5"
                        >
                          <p className="text-[9px] uppercase tracking-[0.26em] text-[var(--color-muted-foreground)]">{s.label}</p>
                          <p className="mt-1 text-sm font-bold" style={{ color: s.accent }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pt-5 pb-6">
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timelineChart} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="inputFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartInputColor} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={chartInputColor} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="outputFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartOutputColor} stopOpacity={0.24} />
                            <stop offset="95%" stopColor={chartOutputColor} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.2} vertical={false} />
                        <XAxis
                          dataKey="dateLabel"
                          stroke="var(--color-muted-foreground)"
                          tickLine={false}
                          axisLine={false}
                          fontSize={10}
                          minTickGap={32}
                        />
                        <YAxis hide />
                        <Tooltip
                          cursor={{ stroke: 'oklch(0.72 0.24 290 / 0.35)', strokeWidth: 1 }}
                          contentStyle={{
                            backgroundColor: 'oklch(0.11 0.015 265 / 0.96)',
                            border: '1px solid oklch(0.22 0.018 265)',
                            borderRadius: '12px',
                            color: 'oklch(0.97 0.008 255)',
                            fontSize: '12px',
                          }}
                        />
                        <Area type="monotone" dataKey="input" stroke={chartInputColor} strokeWidth={2} fill="url(#inputFill)" name="Input" />
                        <Area type="monotone" dataKey="output" stroke={chartOutputColor} strokeWidth={2} fill="url(#outputFill)" name="Output" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Sidebar — 400px, three stacked cards */}
              <div className="flex flex-col gap-4">

                {/* Snapshot */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Zap size={13} style={{ color: 'oklch(0.72 0.24 290)' }} />
                      <CardTitle className="text-sm">Current view</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Filter-aware snapshot.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-[var(--color-muted-foreground)]">Tokens</span>
                        <span className="font-semibold" style={{ color: '#a78bfa' }}>{totalTokens}</span>
                      </div>
                      <Progress value={88} />
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-[var(--color-muted-foreground)]">Spend</span>
                        <span className="font-semibold" style={{ color: '#f9a8d4' }}>{totalCost}</span>
                      </div>
                      <Progress value={64} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Input msgs', value: formatPlain(overview.inputMessages) },
                        { label: 'Output msgs', value: formatPlain(overview.outputMessages) },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-background)]/80 p-3"
                        >
                          <p className="text-[9px] uppercase tracking-[0.24em] text-[var(--color-muted-foreground)]">{item.label}</p>
                          <p className="mt-1.5 text-lg font-bold">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Source split */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Source split</CardTitle>
                    <CardDescription className="text-xs">Token share by provider.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5 pt-0">
                    {providers.map((provider) => {
                      const totalProviderTokens = (provider.tokens?.input || 0) + (provider.tokens?.output || 0);
                      const share = (totalProviderTokens / Math.max(overview.input + overview.output, 1)) * 100;
                      return (
                        <div
                          key={provider.id}
                          className="rounded-xl p-3"
                          style={{
                            background: `color-mix(in oklab, ${provider.color} 7%, var(--color-muted))`,
                            border: `1px solid color-mix(in oklab, ${provider.color} 22%, var(--color-border))`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold" style={{ color: provider.color }}>{provider.label}</p>
                              <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)] truncate">
                                {formatPlain(totalProviderTokens)} tk · {formatMoney(provider.cost || 0)}
                              </p>
                            </div>
                            <div className="shrink-0 text-right text-[11px] text-[var(--color-muted-foreground)]">
                              <p>{formatPlain(provider.conversations || 0)} sessions</p>
                              <p>{formatPlain(provider.errors || 0)} errors</p>
                            </div>
                          </div>
                          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[var(--color-muted)]">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.max(6, share)}%`,
                                backgroundColor: provider.color,
                                boxShadow: `0 0 6px ${provider.color}55`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Model coverage */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Model coverage</CardTitle>
                    <CardDescription className="text-xs">Pricing via models.dev.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div
                      className="rounded-xl p-4"
                      style={{
                        background: 'linear-gradient(135deg, oklch(0.72 0.24 290 / 0.1), oklch(0.68 0.20 198 / 0.07))',
                        border: '1px solid oklch(0.72 0.24 290 / 0.2)',
                      }}
                    >
                      <p className="text-[9px] uppercase tracking-[0.3em] text-[var(--color-muted-foreground)]">Active models</p>
                      <p className="mt-1.5 text-4xl font-bold gradient-text-violet">{modelCount}</p>
                      <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">models.dev pricing</p>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </motion.div>
          )}

          {/* ── Sessions tab ── */}
          {activeTab === 'sessions' && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"
            >
              <Card className="overflow-hidden p-0">
                <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-4">
                  <div>
                    <Badge variant="soft" className="mb-2.5">Top sessions</Badge>
                    <h3 className="gradient-text text-xl font-bold tracking-tight">Largest conversations</h3>
                    <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">Ranked by total token load.</p>
                  </div>
                  <Briefcase size={15} className="shrink-0 text-[var(--color-muted-foreground)]" />
                </div>
                <div className="px-6 pb-6 space-y-2">
                  {sessions.map((session: any) => (
                    <div
                      key={session.id}
                      className="group rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-background)]/80 p-4 transition-colors hover:border-[var(--color-border)] hover:bg-[var(--color-background)]"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full border border-[var(--color-border)]/50 bg-[var(--color-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-muted-foreground)]">
                              {formatPlain(session.tokens || 0)} tk
                            </span>
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{
                                backgroundColor: `${SOURCE_COLORS[session.source as keyof typeof SOURCE_COLORS] || SOURCE_COLORS.all}18`,
                                color: SOURCE_COLORS[session.source as keyof typeof SOURCE_COLORS] || SOURCE_COLORS.all,
                                border: `1px solid ${SOURCE_COLORS[session.source as keyof typeof SOURCE_COLORS] || SOURCE_COLORS.all}35`,
                              }}
                            >
                              {sourceLabel(session.source as SourceId)}
                            </span>
                            {session.model && (
                              <span className="rounded-full border border-[var(--color-border)]/50 px-2 py-0.5 text-[10px] text-[var(--color-muted-foreground)] truncate max-w-[12rem]">
                                {session.model}
                              </span>
                            )}
                          </div>
                          <h4 className="mt-2 truncate text-sm font-semibold">{session.title}</h4>
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
                            <span className="inline-flex items-center gap-1"><Briefcase size={10} />{session.project || 'General'}</span>
                            <span className="inline-flex items-center gap-1"><Calendar size={10} />{session.date || 'unknown'}</span>
                            <span className="inline-flex items-center gap-1"><Terminal size={10} />{formatPlain(session.tools || 0)} tools</span>
                            <span className="inline-flex items-center gap-1"><ShieldCheck size={10} />{formatPlain(session.errors || 0)} errors</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <div className="text-right">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted-foreground)]">Cost</p>
                            <p className="mt-0.5 text-sm font-bold" style={{ color: '#f9a8d4' }}>{formatMoney(session.cost || 0)}</p>
                          </div>
                          <ChevronRight size={15} className="text-[var(--color-muted-foreground)] transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">Recent activity</CardTitle>
                      <CardDescription className="mt-0.5 text-xs">Latest sessions in view.</CardDescription>
                    </div>
                    <Activity size={13} className="shrink-0 text-[var(--color-muted-foreground)]" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {(currentStats.recentActivity || [])
                    .filter((s: any) => sourceFilter === 'all' || s.source === sourceFilter)
                    .slice(0, 6)
                    .map((s: any) => (
                      <div
                        key={s.id}
                        className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-background)]/80 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold">{s.title}</p>
                            <p className="mt-0.5 text-[11px] text-[var(--color-muted-foreground)]">{s.project || 'General'} · {s.date || 'unknown'}</p>
                          </div>
                          <div className="shrink-0 text-right text-[11px] text-[var(--color-muted-foreground)]">
                            <p>{formatPlain(s.tokens || 0)} tk</p>
                            <p style={{ color: '#f9a8d4' }}>{formatMoney(s.cost || 0)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Engineering tab ── */}
          {activeTab === 'engineering' && (
            <motion.div
              key="engineering"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="grid gap-5 lg:grid-cols-2"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="soft" className="mb-2.5">Engineering</Badge>
                      <h3 className="gradient-text text-xl font-bold">Files &amp; code churn</h3>
                    </div>
                    <Code2 size={14} className="shrink-0 text-[var(--color-muted-foreground)]" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: 'Files touched', value: formatPlain(currentStats.engineering?.filesAffected || 0), color: '#a78bfa' },
                      { label: 'LOC written', value: formatPlain(currentStats.engineering?.totalLOC || 0), color: '#67e8f9' },
                      { label: 'Summary files', value: formatPlain(currentStats.engineering?.summaryFiles || 0), color: '#fcd34d' },
                      { label: 'Tools/session', value: (currentStats.engineering?.toolsPerSession || 0).toFixed(1), color: '#f9a8d4' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-background)]/80 p-4"
                        style={{ borderColor: `color-mix(in oklab, ${item.color} 20%, oklch(0.22 0.018 265))` }}
                      >
                        <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-[var(--color-muted-foreground)]">{item.label}</p>
                        <p className="mt-2.5 text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {projectRows.map((project: any) => (
                      <div
                        key={project.name}
                        className="flex items-center justify-between rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-background)]/80 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{project.name}</p>
                          <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">{formatPlain(project.sessions || 0)} sessions · {formatPlain(project.tools || 0)} tools</p>
                        </div>
                        <div className="ml-4 shrink-0 text-right">
                          <p className="text-sm font-bold" style={{ color: '#f9a8d4' }}>{formatMoney(project.cost || 0)}</p>
                          <p className="text-xs text-[var(--color-muted-foreground)]">{formatPlain(project.totalTokens || 0)} tk</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="soft" className="mb-2.5">Protocol</Badge>
                      <h3 className="gradient-text text-xl font-bold">Most used tools</h3>
                    </div>
                    <Terminal size={14} className="shrink-0 text-[var(--color-muted-foreground)]" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {toolRows.map((tool, index) => (
                    <div
                      key={tool.name}
                      className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-background)]/80 p-3.5"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold">{tool.name}</p>
                        <p className="shrink-0 text-sm font-bold" style={{ color: MODEL_COLORS[index % MODEL_COLORS.length] }}>
                          {formatPlain(tool.count)}
                        </p>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-muted)]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(6, (tool.count / Math.max(toolRows[0]?.count || 1, 1)) * 100)}%`,
                            backgroundColor: MODEL_COLORS[index % MODEL_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Models tab ── */}
          {activeTab === 'models' && (
            <motion.div
              key="models"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="grid gap-5 lg:grid-cols-2"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="soft" className="mb-2.5">Models</Badge>
                      <h3 className="gradient-text text-xl font-bold">Usage by model ID</h3>
                    </div>
                    <Brain size={14} className="shrink-0 text-[var(--color-muted-foreground)]" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-hidden rounded-xl border border-[var(--color-border)]/50">
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 border-b border-[var(--color-border)]/50 bg-[var(--color-muted)]/50 px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.3em] text-[var(--color-muted-foreground)]">
                      <div>Model</div>
                      <div>Source</div>
                      <div className="text-right">Sessions</div>
                      <div className="text-right">Tokens</div>
                    </div>
                    <div className="divide-y divide-[var(--color-border)]/40">
                      {modelRows.map((model: any, index: number) => (
                        <div
                          key={model.name}
                          className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center bg-[var(--color-background)]/80 px-4 py-3 transition-colors hover:bg-[var(--color-muted)]/30"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold">{model.name}</p>
                            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--color-muted)]">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.max(8, (model.tokens / Math.max(modelRows[0]?.tokens || 1, 1)) * 100)}%`,
                                  backgroundColor: MODEL_COLORS[index % MODEL_COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                          <p
                            className="shrink-0 text-[10px] font-medium uppercase tracking-[0.2em]"
                            style={{ color: SOURCE_COLORS[model.source as keyof typeof SOURCE_COLORS] || 'var(--color-muted-foreground)' }}
                          >
                            {model.source}
                          </p>
                          <p className="shrink-0 text-right text-xs font-semibold">{formatPlain(model.sessions || 0)}</p>
                          <p className="shrink-0 text-right text-xs font-semibold">{formatPlain(model.tokens || 0)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="soft" className="mb-2.5">Providers</Badge>
                      <h3 className="gradient-text text-xl font-bold">Tokens, spend &amp; errors</h3>
                    </div>
                    <LineChart size={14} className="shrink-0 text-[var(--color-muted-foreground)]" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={providers} barCategoryGap="30%" margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.25} vertical={false} />
                        <XAxis dataKey="label" stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'oklch(0.11 0.015 265 / 0.96)',
                            border: '1px solid oklch(0.22 0.018 265)',
                            borderRadius: '12px',
                            color: 'oklch(0.97 0.008 255)',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="cost" radius={[8, 8, 0, 0]}>
                          {providers.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

        </main>

        {/* ── Footer ── */}
        <footer className="mt-4 rounded-2xl border border-[var(--color-border)]/50 bg-[color-mix(in_oklab,var(--color-card)_72%,transparent)] px-5 py-3.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-[var(--color-muted-foreground)]">
            <div className="flex items-center gap-3">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.72 0.24 290 / 0.18), oklch(0.68 0.20 198 / 0.1))',
                  border: '1px solid oklch(0.72 0.24 290 / 0.22)',
                }}
              >
                <Cpu size={13} style={{ color: 'oklch(0.78 0.18 290)' }} />
              </div>
              <div>
                <p className="font-semibold text-[var(--color-foreground)] text-xs">Antigravity Token Analyzer</p>
                <p className="text-[10px]">Local-only dashboard for Antigravity, OpenCode &amp; imported chat stats.</p>
              </div>
            </div>
            <p className="uppercase tracking-[0.24em] text-[10px]">{new Date().getFullYear()} · Paranjay</p>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default App;
