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

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1840px] flex-col px-5 py-5 lg:px-8">
        <header className="sticky top-4 z-20 mb-8">
          <Card className="overflow-hidden">
            <div className="px-6 py-6 lg:px-8 lg:py-7">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-4xl">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Badge variant="soft">Local AI Usage Atlas</Badge>
                    <Badge variant="outline">Pricing via models.dev</Badge>
                    <Badge variant="outline">CodexBar-friendly logs</Badge>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-primary)_14%,transparent)] text-[var(--color-primary)]">
                      <Cpu size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[var(--color-muted-foreground)]">Analyzer Console</p>
                      <h1 className="mt-2 max-w-3xl text-[clamp(2rem,4vw,3.9rem)] font-semibold leading-[0.95] tracking-tight">
                        One calm place for Antigravity, OpenCode, Codex, and saved chat archives.
                      </h1>
                      <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-muted-foreground)] md:text-base">
                        Real session counts, model IDs, prompt flow, cost tracking, and engineering signals, laid out with a lot more breathing room so the data can actually read like a dashboard.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:min-w-[430px]">
                  {[
                    { label: 'Sessions', value: totalSessions, icon: MessageSquareText, tone: 'text-[var(--color-primary)]' },
                    { label: 'Models', value: formatPlain(modelCount), icon: Brain, tone: 'text-cyan-300' },
                    { label: 'Tools', value: formatPlain(toolCount), icon: Terminal, tone: 'text-amber-300' },
                    { label: 'Errors', value: formatPlain(errorCount), icon: ShieldCheck, tone: 'text-emerald-300' }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Card key={item.label} className="p-0">
                        <CardContent className="flex items-start justify-between p-5">
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                              {item.label}
                            </div>
                            <div className="mt-4 text-3xl font-semibold tracking-tight">{item.value}</div>
                          </div>
                          <div className={`rounded-full border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 ${item.tone}`}>
                            <Icon size={15} />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <Separator className="my-6" />

              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <Button
                        key={tab.id}
                        variant={activeTab === tab.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveTab(tab.id)}
                        className="gap-2"
                      >
                        <Icon size={13} />
                        {tab.label}
                      </Button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-full border border-[var(--color-border)] bg-[var(--color-background)] p-1">
                    {(['all', 'antigravity', 'opencode', 'codex'] as SourceId[]).map((source) => (
                      <Button
                        key={source}
                        variant={sourceFilter === source ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSourceFilter(source)}
                        className="px-3"
                      >
                        {sourceLabel(source)}
                      </Button>
                    ))}
                  </div>

                  <div className="flex rounded-full border border-[var(--color-border)] bg-[var(--color-background)] p-1">
                    {(['all', '30', '7'] as RangeId[]).map((range) => (
                      <Button
                        key={range}
                        variant={dateRange === range ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setDateRange(range)}
                        className="px-3"
                      >
                        {range === 'all' ? 'All time' : `${range}d`}
                      </Button>
                    ))}
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs font-medium text-[var(--color-muted-foreground)] transition hover:text-[var(--color-foreground)]">
                    <FolderOpen size={14} />
                    Import JSON
                    <input type="file" className="hidden" accept=".json" onChange={handleUpload} />
                  </label>

                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download size={14} />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </header>

        <main className="flex-1 pb-10">
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="grid gap-12 xl:grid-cols-[minmax(0,1.55fr)_340px]"
          >
            <Card className="overflow-hidden">
              <CardHeader className="px-8 pt-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <Badge variant="soft" className="w-fit">Usage over time</Badge>
                    <CardTitle className="mt-3 text-[clamp(1.8rem,2.6vw,2.8rem)] leading-[0.98]">
                      Daily input and output flow
                    </CardTitle>
                    <CardDescription className="mt-3 max-w-2xl text-base leading-7">
                      A quieter time-series view with enough scale to see spikes, but not so many surrounding widgets that the chart gets crowded out.
                    </CardDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-[var(--color-muted-foreground)] lg:min-w-[220px] lg:text-right">
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3">
                      <div className="text-[10px] uppercase tracking-[0.28em]">Cost</div>
                      <div className="mt-2 text-lg font-semibold text-[var(--color-foreground)]">{totalCost}</div>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3">
                      <div className="text-[10px] uppercase tracking-[0.28em]">Tokens</div>
                      <div className="mt-2 text-lg font-semibold text-[var(--color-foreground)]">{totalTokens}</div>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3">
                      <div className="text-[10px] uppercase tracking-[0.28em]">Tools</div>
                      <div className="mt-2 text-lg font-semibold text-[var(--color-foreground)]">{formatPlain(overview.tools)}</div>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3">
                      <div className="text-[10px] uppercase tracking-[0.28em]">Sessions</div>
                      <div className="mt-2 text-lg font-semibold text-[var(--color-foreground)]">{totalSessions}</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-8 pt-8">
                <div className="h-[440px]">
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
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.28} vertical={false} />
                      <XAxis
                        dataKey="dateLabel"
                        stroke="var(--color-muted-foreground)"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        minTickGap={28}
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
              </CardContent>
            </Card>

            <div className="space-y-7">
              <Card>
                <CardHeader>
                  <CardTitle>Current view</CardTitle>
                  <CardDescription>Filter-aware snapshot of the data set.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-[var(--color-muted-foreground)]">Tokens</span>
                      <span className="font-medium">{totalTokens}</span>
                    </div>
                    <Progress value={88} />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-[var(--color-muted-foreground)]">Spend</span>
                      <span className="font-medium">{totalCost}</span>
                    </div>
                    <Progress value={64} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <Card className="p-0">
                      <CardContent className="p-4">
                        <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-muted-foreground)]">Input msgs</div>
                        <div className="mt-2 text-xl font-semibold">{formatPlain(overview.inputMessages)}</div>
                      </CardContent>
                    </Card>
                    <Card className="p-0">
                      <CardContent className="p-4">
                        <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-muted-foreground)]">Output msgs</div>
                        <div className="mt-2 text-xl font-semibold">{formatPlain(overview.outputMessages)}</div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Source split</CardTitle>
                  <CardDescription>Antigravity, OpenCode, and Codex, with real source shares.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {providers.map((provider) => {
                    const totalProviderTokens = (provider.tokens?.input || 0) + (provider.tokens?.output || 0);
                    const share = (totalProviderTokens / Math.max(overview.input + overview.output, 1)) * 100;
                    return (
                      <div key={provider.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                        <div className="flex items-start justify-between gap-4">
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
                            style={{
                              width: `${Math.max(8, share)}%`,
                              backgroundColor: provider.color
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pricing source</CardTitle>
                  <CardDescription>Live models.dev pricing with a local fallback snapshot.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <Badge variant="soft">models.dev</Badge>
                    <span className="text-xs text-[var(--color-muted-foreground)]">Updated by analyzer</span>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-4">
                    <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">Model coverage</div>
                    <div className="mt-2 text-4xl font-semibold tracking-tight">{modelCount}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.section>

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
                    <Activity size={16} className="text-[var(--color-muted-foreground)]" />
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
