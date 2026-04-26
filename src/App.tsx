/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-useless-escape */
import { useMemo, useState } from 'react';
import { 
  Coins, 
  Cpu, 
  Zap, 
  Terminal,
  FileCode,
  Layout,
  Search,
  ImageIcon,
  ChevronRight,
  Layers,
  FilePlus,
  Briefcase,
  Download,
  Trophy,
  Flame,
  Calendar,
  Activity as ActivityIcon,
  FolderOpen,
  RefreshCw,
  Code2,
  ShieldCheck,
  MousePointer2,
  Settings,
  Brain
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import stats from './data/stats.json';

const COLORS = ['#22d3ee', '#c084fc', '#818cf8', '#f472b6', '#fbbf24'];

const ToolIcon = ({ name }: { name: string }) => {
  const iconSize = 16;
  if (name.includes('file') || name.includes('replace')) return <FileCode size={iconSize} />;
  if (name.includes('command') || name.includes('terminal') || name.includes('status')) return <Terminal size={iconSize} />;
  if (name.includes('search')) return <Search size={iconSize} />;
  if (name.includes('image')) return <ImageIcon size={iconSize} />;
  if (name.includes('chrome')) return <Layout size={iconSize} />;
  if (name.includes('git')) return <RefreshCw size={iconSize} />;
  return <Zap size={iconSize} />;
};

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentStats, setCurrentStats] = useState(stats);
  const [dateRange, setDateRange] = useState<'all'|'7'|'30'>('all');

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentStats));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `antigravity_stats_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          setCurrentStats(json);
        } catch {
          alert("Invalid stats payload detected.");
        }
      };
      reader.readAsText(file);
    }
  };

  const modelDistribution = useMemo(() => {
    return Object.entries(currentStats.models || {})
      .map(([name, data]) => ({ name, value: (data as any).tokens }))
      .sort((a, b) => b.value - a.value);
  }, [currentStats]);

  const intelligenceDensity = useMemo(() => {
    const totalInput = currentStats.totalTokens.input;
    const totalPrompts = currentStats.messageCount.input;
    return (totalInput / (totalPrompts || 1)).toFixed(0);
  }, [currentStats]);

  const projectData = useMemo(() => {
    return Object.entries(currentStats.projects)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => (b as any).tokens - (a as any).tokens)
      .slice(0, 12);
  }, [currentStats]);

  const filteredTimeline = useMemo(() => {
    const now = new Date();
    return currentStats.timelineArray.filter((t: any) => {
      if (dateRange === 'all') return true;
      const d = new Date(t.date);
      const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
      return diffDays <= parseInt(dateRange);
    });
  }, [currentStats, dateRange]);

  const filteredOverview = useMemo(() => {
    return filteredTimeline.reduce((acc, day) => {
      acc.cost += day.cost;
      acc.tokens += day.input + day.output;
      acc.tools += day.tools;
      acc.inputMessages += day.inputMessages || 0;
      acc.outputMessages += day.outputMessages || 0;
      return acc;
    }, { 
      cost: 0, 
      tokens: 0, 
      errors: currentStats.providers.antigravity.errors, 
      tools: 0,
      inputMessages: 0,
      outputMessages: 0
    });
  }, [currentStats, filteredTimeline]);

  const efficiencyScore = useMemo(() => {
    const tokensPerLoc = (currentStats.totalTokens.input + currentStats.totalTokens.output) / (currentStats.engineering.totalLOC || 1);
    const errorRate = currentStats.providers.antigravity.errors / (currentStats.messageCount.output || 1);
    const score = 100 - (errorRate * 1000) - (tokensPerLoc / 500);
    return Math.min(100, Math.max(0, score)).toFixed(1);
  }, [currentStats]);

  return (
    <div className="min-h-screen text-[var(--color-foreground)] selection:bg-[var(--color-accent)] font-sans flex overflow-hidden">

      {/* Modern Sidebar */}
      <nav className="w-20 lg:w-24 flex flex-col items-center py-10 border-r border-[var(--color-border)] bg-[var(--color-background)] z-50 shrink-0">
        <div className="h-12 w-12 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] flex items-center justify-center mb-12 cursor-pointer transition-transform hover:scale-105">
          <Cpu size={24} />
        </div>
        
        <div className="flex flex-col gap-5">
          {[
            { id: 'overview', icon: <Layout size={22} />, label: 'Intelligence Hub' },
            { id: 'projects', icon: <Briefcase size={22} />, label: 'Active Projects' },
            { id: 'engineering', icon: <Code2 size={22} />, label: 'Deep Engineering' },
            { id: 'halloffame', icon: <Trophy size={22} />, label: 'Elite Sessions' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`sidebar-item group ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.icon}
              <div className="tooltip">{tab.label}</div>
            </button>
          ))}
        </div>
        
        <div className="mt-auto flex flex-col gap-5">
          <label className="sidebar-item group cursor-pointer">
            <FolderOpen size={22} />
            <input type="file" className="hidden" onChange={handleUpload} accept=".json" />
            <div className="tooltip">Import Dataset</div>
          </label>
          <button onClick={handleDownload} className="sidebar-item group">
            <Download size={22} />
            <div className="tooltip">Export Report</div>
          </button>
          <div className="sidebar-item group">
            <Settings size={22} />
            <div className="tooltip">Settings</div>
          </div>
        </div>
      </nav>

      {/* Main Scrollable Content */}
      <div className="flex-1 h-screen overflow-y-auto relative scroll-smooth">
        <main className="p-8 lg:p-12 max-w-[1600px] mx-auto w-full">
          {/* Header */}
          <header className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-3">
                Antigravity Console
              </h1>
              <div className="flex items-center gap-4 text-sm text-[var(--color-muted-foreground)]">
                <div className="flex items-center gap-2">
                  <ActivityIcon size={14} className="text-[var(--color-foreground)]" />
                  <span className="font-semibold text-[var(--color-foreground)]">Protocol v2.9</span>
                </div>
                <div className="h-4 w-[1px] bg-[var(--color-border)]" />
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} />
                  <span>Production Hardened</span>
                </div>
                <div className="h-4 w-[1px] bg-[var(--color-border)] hidden lg:block" />
                <span className="hidden lg:block">Last Synced: Just Now</span>
              </div>
            </motion.div>

            <div className="flex flex-col items-end gap-4">
              <div className="flex items-center gap-3">
                <div className="flex bg-[var(--color-muted)] p-1 rounded-[var(--radius)]">
                  {(['all', '30', '7'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setDateRange(r)}
                      className={`px-4 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all ${dateRange === r ? 'bg-[var(--color-background)] text-[var(--color-foreground)] shadow-sm' : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'}`}
                    >
                      {r === 'all' ? 'All Time' : `${r}D`}
                    </button>
                  ))}
                </div>
                <div className="px-5 py-2 rounded-[var(--radius)] bg-[var(--color-muted)] flex items-center gap-2">
                  <Flame size={16} className="text-[var(--color-foreground)]" />
                  <span className="text-sm font-semibold tracking-tight">{currentStats.conversations} Sessions</span>
                </div>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="ov" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }} 
                className="space-y-10"
              >
                {/* Hero Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                  {[
                    { label: 'Total Investment', value: `$${filteredOverview?.cost.toFixed(2)}`, icon: <Coins size={18} />, color: 'text-indigo-400' },
                    { label: 'Intelligence Density', value: `${parseInt(intelligenceDensity).toLocaleString()}`, icon: <Brain size={18} />, color: 'text-rose-400' },
                    { label: 'Context Throughput', value: (filteredOverview?.tokens / 1e6).toFixed(1) + 'M', icon: <Zap size={18} />, color: 'text-amber-400' },
                    { label: 'Human Logic', value: (dateRange === 'all' ? currentStats.messageCount.input : filteredOverview.inputMessages).toLocaleString(), icon: <MousePointer2 size={18} />, color: 'text-blue-400' },
                    { label: 'Engine Health', value: efficiencyScore + '%', icon: <ActivityIcon size={18} />, color: 'text-emerald-400' },
                    { label: 'Tool Mastery', value: (filteredOverview?.tools || 0).toLocaleString(), icon: <Terminal size={18} />, color: 'text-slate-400' },
                  ].map((s) => (
                    <div key={s.label} className="ui-card flex flex-col justify-between h-[140px]">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-medium text-[var(--color-muted-foreground)]">{s.label}</p>
                        <div className={`${s.color} bg-[var(--color-muted)] p-2 rounded-md`}>
                          {s.icon}
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">{s.value}</h2>
                    </div>
                  ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 ui-card min-h-[400px] flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <ActivityIcon size={16} className="text-[var(--color-foreground)]" /> 
                          Token Velocity
                        </h3>
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">Volume distribution over time</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-indigo-500" />
                          <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Input</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-rose-500" />
                          <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Output</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 w-full min-h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredTimeline}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                          <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                          <YAxis hide />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', color: 'var(--color-card-foreground)' }} />
                          <Area type="monotone" dataKey="input" stroke="#6366f1" strokeWidth={2} fillOpacity={0.1} fill="#6366f1" />
                          <Area type="monotone" dataKey="output" stroke="#f43f5e" strokeWidth={2} fillOpacity={0.1} fill="#f43f5e" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="ui-card flex flex-col min-h-[400px]">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <Cpu size={16} /> 
                      Neural Distribution
                    </h3>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="h-[200px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={modelDistribution} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                              {modelDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', color: 'var(--color-card-foreground)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-2xl font-bold text-[var(--color-foreground)] leading-none mt-1">
                            {modelDistribution.length}
                          </span>
                          <span className="text-xs font-medium text-[var(--color-muted-foreground)] mt-1">Models</span>
                        </div>
                      </div>
                      
                      <div className="mt-6 space-y-2 px-2 overflow-y-auto max-h-[120px] scrollbar-hide">
                        {modelDistribution.map((d, i) => (
                          <div key={d.name} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="font-medium text-[var(--color-muted-foreground)] truncate max-w-[140px]">{d.name}</span>
                            </div>
                            <span className="font-semibold text-[var(--color-foreground)]">{(d.value / 1e6).toFixed(1)}M</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'projects' && (
              <motion.div 
                key="pj" 
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {projectData.map((p: any) => (
                  <div key={p.name} className="ui-card flex flex-col justify-between h-[280px]">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-foreground)]">
                          <Briefcase size={18} />
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-[var(--color-muted-foreground)]">{p.sessions} Sessions</p>
                          <h4 className="text-base font-bold text-[var(--color-foreground)] mt-1 truncate max-w-[150px]">{pName(p.name)}</h4>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Resource Drain</span>
                          <span className="text-lg font-bold text-[var(--color-foreground)] tracking-tight">${p.cost.toFixed(2)}</span>
                        </div>
                        <div className="h-2 w-full bg-[var(--color-muted)] rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(5, (p.cost / currentStats.totalCost) * 100)}%` }}
                            className="h-full bg-[var(--color-foreground)] rounded-full" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <div className="p-3 rounded-[var(--radius)] bg-[var(--color-muted)]/50 border border-[var(--color-border)]">
                        <p className="text-xs text-[var(--color-muted-foreground)] font-medium mb-1">Synthetic</p>
                        <p className="text-lg font-bold text-[var(--color-foreground)] tracking-tight">{(p.tokens / 1000).toFixed(0)}K</p>
                      </div>
                      <div className="p-3 rounded-[var(--radius)] bg-[var(--color-muted)]/50 border border-[var(--color-border)]">
                        <p className="text-xs text-[var(--color-muted-foreground)] font-medium mb-1">Health</p>
                        <p className={`text-lg font-bold tracking-tight ${p.errors > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{p.errors > 0 ? `-${p.errors}` : 'Optimal'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'engineering' && (
              <motion.div 
                key="eng" 
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="space-y-10"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Files Mutated', value: currentStats.engineering.filesAffected, icon: <FileCode size={20} className="text-indigo-400" /> },
                    { label: 'Synthetic LOC', value: currentStats.engineering.totalLOC.toLocaleString(), icon: <FilePlus size={20} className="text-emerald-400" /> },
                    { label: 'Neural Artifacts', value: currentStats.providers.antigravity.artifacts, icon: <Layers size={20} className="text-blue-400" /> },
                    { label: 'Runtime Stability', value: '99.9%', icon: <ShieldCheck size={20} className="text-amber-400" /> },
                  ].map(s => (
                    <div key={s.label} className="ui-card text-center flex flex-col justify-center items-center py-8 h-[200px]">
                      <div className="w-12 h-12 rounded-[var(--radius)] bg-[var(--color-muted)] flex items-center justify-center mb-4">
                        {s.icon}
                      </div>
                      <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-2">{s.label}</p>
                      <h3 className="text-3xl font-bold text-[var(--color-foreground)] tracking-tight">{s.value}</h3>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Heatmap */}
                  <div className="ui-card flex flex-col min-h-[300px]">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <ActivityIcon size={16} /> 
                          Neural Activity
                        </h3>
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">60-day intelligence heatmap</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 items-center justify-start flex-1">
                      {Array.from({ length: 60 }).map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (59 - i));
                        const dateStr = d.toISOString().split('T')[0];
                        const dayData = (currentStats.timeline as any)?.[dateStr];
                        const count = dayData ? dayData.input + dayData.output : 0;
                        
                        let bgClass = "bg-[var(--color-muted)]";
                        if (count > 0 && count < 50000) bgClass = "bg-indigo-500/30";
                        else if (count >= 50000 && count < 200000) bgClass = "bg-indigo-500/60";
                        else if (count >= 200000 && count < 500000) bgClass = "bg-indigo-500/80";
                        else if (count >= 500000) bgClass = "bg-indigo-500";
                        
                        return (
                          <div 
                            key={dateStr} 
                            title={`${dateStr}: ${count.toLocaleString()} tokens`} 
                            className={`w-5 h-5 lg:w-6 lg:h-6 rounded-[var(--radius-sm)] ${bgClass} border border-[var(--color-border)] hover:border-[var(--color-foreground)] transition-colors cursor-crosshair`} 
                          />
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[var(--color-border)] text-xs font-medium text-[var(--color-muted-foreground)]">
                      <span>Less</span>
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-[var(--radius-sm)] bg-[var(--color-muted)] border border-[var(--color-border)]" />
                        <div className="w-3 h-3 rounded-[var(--radius-sm)] bg-indigo-500/30 border border-[var(--color-border)]" />
                        <div className="w-3 h-3 rounded-[var(--radius-sm)] bg-indigo-500/60 border border-[var(--color-border)]" />
                        <div className="w-3 h-3 rounded-[var(--radius-sm)] bg-indigo-500/80 border border-[var(--color-border)]" />
                        <div className="w-3 h-3 rounded-[var(--radius-sm)] bg-indigo-500 border border-[var(--color-border)]" />
                      </div>
                      <span>More</span>
                    </div>
                  </div>

                  {/* Tool Usage */}
                  <div className="ui-card">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Code2 size={16} /> 
                        Protocol Execution
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                      {Object.entries(currentStats.toolUsage).sort((a: any, b: any) => b[1] - a[1]).slice(0, 14).map(([name, count]: any) => (
                        <div key={name} className="flex items-center gap-4 group">
                          <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)] flex items-center justify-center transition-colors group-hover:text-[var(--color-foreground)] shrink-0">
                            <ToolIcon name={name} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between mb-1.5 items-end">
                              <span className="text-sm font-medium truncate text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)] transition-colors">{name.replace('mcp_', '')}</span>
                              <span className="text-xs font-semibold text-[var(--color-foreground)]">{count.toLocaleString()}</span>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--color-muted)] rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(count / (Object.values(currentStats.toolUsage)[0] as number)) * 100}%` }}
                                className="h-full bg-[var(--color-primary)]" 
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'halloffame' && (
              <motion.div 
                key="hof" 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="space-y-6 pb-20"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-[var(--color-foreground)]">
                      <Trophy size={28} /> 
                      Intelligence Elite
                    </h2>
                    <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Top 15 Session Benchmarks</p>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {currentStats.topConversations.map((c: any, i: number) => (
                    <div 
                      key={c.id} 
                      className="ui-card flex flex-col lg:flex-row lg:items-center gap-6 group hover:border-[var(--color-muted-foreground)] transition-colors relative overflow-hidden p-5"
                    >
                      <div className="text-2xl font-bold text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)] transition-colors w-12 text-center shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate text-lg tracking-tight text-[var(--color-foreground)]">{c.title}</h4>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-[var(--color-muted-foreground)]" />
                            <span className="text-xs font-medium text-[var(--color-muted-foreground)]">{c.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Briefcase size={14} className="text-[var(--color-muted-foreground)]" />
                            <span className="text-xs font-medium text-[var(--color-muted-foreground)]">{pName(c.project)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap size={14} className="text-[var(--color-muted-foreground)]" />
                            <span className="text-xs font-semibold text-[var(--color-foreground)]">{c.tokens.toLocaleString()} Tokens</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 lg:text-right shrink-0">
                        <div className="hidden sm:block">
                          <p className="text-xs text-[var(--color-muted-foreground)] font-medium mb-1">{c.tools} Tools Executed</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">
                            ${c.cost.toFixed(3)}
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)] group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="p-8 border-t border-[var(--color-border)] bg-[var(--color-background)] mt-auto">
          <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[var(--color-muted-foreground)]">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-[var(--color-muted)] flex items-center justify-center">
                <Cpu size={16} />
              </div>
              <div>
                <span className="block text-sm font-semibold text-[var(--color-foreground)]">Antigravity</span>
                <span className="block text-xs mt-0.5">Console v2.9.0</span>
              </div>
            </div>
            <p className="text-xs font-medium">
              &copy; {new Date().getFullYear()} Paranjay
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

const pName = (name: string) => {
  if (!name || name === '\"' || name === '""') return 'SYST-GEN';
  return name.replace(/"/g, '').toUpperCase();
};

export default App;
