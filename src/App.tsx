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
  TrendingUp,
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
    <div className="min-h-screen text-slate-200 selection:bg-accent/30 font-sans flex overflow-hidden">
      <div className="bg-blobs">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* Modern Sidebar */}
      <nav className="w-20 lg:w-24 flex flex-col items-center py-10 border-r border-white/5 bg-slate-950/40 backdrop-blur-3xl z-50 shrink-0">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white shadow-2xl shadow-accent/20 mb-12 cursor-pointer hover:scale-105 transition-all">
          <Cpu size={28} className="animate-pulse" />
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
              <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-white mb-4 italic">
                ANTIGRAVITY <span className="text-accent-gradient">PRIME</span>
              </h1>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                  <ActivityIcon size={12} className="text-accent" />
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest">Protocol v2.8</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Production Hardened</span>
                </div>
                <div className="hidden lg:block h-[1px] w-12 bg-white/10" />
                <span className="hidden lg:block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Synced: Just Now</span>
              </div>
            </motion.div>

            <div className="flex flex-col items-end gap-4">
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5">
                  {(['all', '30', '7'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setDateRange(r)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${dateRange === r ? 'bg-accent text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {r === 'all' ? 'All Time' : `${r}D`}
                    </button>
                  ))}
                </div>
                <div className="px-5 py-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
                  <div className="relative">
                    <Flame size={18} className="text-orange-500" />
                    <div className="absolute inset-0 bg-orange-500 blur-md opacity-20" />
                  </div>
                  <span className="text-xs font-black tracking-tight">{currentStats.conversations} SESSIONS</span>
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
                    { label: 'Total Investment', value: `$${filteredOverview?.cost.toFixed(2)}`, icon: <Coins />, color: 'text-cyan-400', sub: 'Burn Rate' },
                    { label: 'Intelligence Density', value: `${parseInt(intelligenceDensity).toLocaleString()}`, icon: <Brain />, color: 'text-fuchsia-400', sub: 'Tokens / Prompt' },
                    { label: 'Context Throughput', value: (filteredOverview?.tokens / 1e6).toFixed(1) + 'M', icon: <Zap />, color: 'text-purple-400', sub: 'Input + Output' },
                    { label: 'Human Logic', value: (dateRange === 'all' ? currentStats.messageCount.input : filteredOverview.inputMessages).toLocaleString(), icon: <MousePointer2 />, color: 'text-blue-400', sub: 'Prompts' },
                    { label: 'Engine Health', value: efficiencyScore + '%', icon: <ActivityIcon />, color: 'text-emerald-400', sub: 'Efficiency Score' },
                    { label: 'Tool Mastery', value: (filteredOverview?.tools || 0).toLocaleString(), icon: <Terminal />, color: 'text-orange-400', sub: 'MCP Executions' },
                  ].map((s) => (
                    <div key={s.label} className="glass-card group cursor-default">
                      <div className={`w-10 h-10 rounded-xl bg-slate-950/50 flex items-center justify-center mb-6 border border-white/5 ${s.color} group-hover:scale-110 group-hover:border-accent/20 transition-all`}>
                        {s.icon}
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                      <h2 className="text-3xl font-black tracking-tight text-white group-hover:text-accent transition-colors">{s.value}</h2>
                      <div className="flex items-center gap-1.5 mt-2">
                        <TrendingUp size={10} className="text-emerald-500" />
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{s.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 glass-card relative overflow-hidden group min-h-[450px]">
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-3">
                          <ActivityIcon size={20} className="text-accent" /> 
                          TOKEN VELOCITY
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Volume distribution over time</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-cyan-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Input</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-fuchsia-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Output</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredTimeline}>
                          <defs>
                            <linearGradient id="colorInput" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                          <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                          <YAxis hide />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
                          <Area type="monotone" dataKey="input" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorInput)" />
                          <Area type="monotone" dataKey="output" stroke="#c084fc" strokeWidth={3} fillOpacity={1} fill="url(#colorOutput)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card flex flex-col min-h-[450px]">
                    <h3 className="text-xl font-bold mb-10 flex items-center gap-3">
                      <Cpu size={20} className="text-primary" /> 
                      NEURAL DISTRIBUTION
                    </h3>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="h-[240px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={modelDistribution} innerRadius={80} outerRadius={105} paddingAngle={8} dataKey="value" stroke="none">
                              {modelDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Core</span>
                          <span className="text-3xl font-black text-white leading-none mt-1">
                            {modelDistribution.length}
                          </span>
                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Active Models</span>
                        </div>
                      </div>
                      
                      <div className="mt-8 space-y-3 px-2 overflow-y-auto max-h-[150px] scrollbar-hide">
                        {modelDistribution.map((d, i) => (
                          <div key={d.name} className="flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                              <div className="h-2 w-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="text-[10px] font-black text-slate-400 group-hover:text-white transition-colors uppercase tracking-[0.1em] truncate max-w-[140px]">{d.name}</span>
                            </div>
                            <span className="font-black text-[10px] text-white">{(d.value / 1e6).toFixed(1)}M</span>
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
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              >
                {projectData.map((p: any) => (
                  <div key={p.name} className="glass-card hover:border-accent/40 group flex flex-col justify-between h-[340px]">
                    <div>
                      <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-center text-accent group-hover:scale-110 transition-all">
                          <Briefcase size={22} />
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{p.sessions} SESSIONS</p>
                          <h4 className="text-sm font-black text-white uppercase mt-1 truncate max-w-[120px]">{pName(p.name)}</h4>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-end mb-3">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resource Drain</span>
                            <span className="text-lg font-black text-accent tracking-tight">${p.cost.toFixed(2)}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-950/80 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(8, (p.cost / currentStats.totalCost) * 100)}%` }}
                              className="h-full bg-gradient-to-r from-accent to-primary rounded-full shadow-[0_0_10px_rgba(34,211,238,0.4)]" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5">
                        <p className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-widest">Synthetic</p>
                        <p className="text-xl font-black text-white tracking-tighter">{(p.tokens / 1000).toFixed(0)}K <span className="text-[10px] text-slate-600 font-normal ml-1">TKNS</span></p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5">
                        <p className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-widest">Health</p>
                        <p className={`text-xl font-black tracking-tighter ${p.errors > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{p.errors > 0 ? `-${p.errors}` : 'OPTIMAL'}</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                  {[
                    { label: 'Files Mutated', value: currentStats.engineering.filesAffected, icon: <FileCode className="text-purple-400" /> },
                    { label: 'Synthetic LOC', value: currentStats.engineering.totalLOC.toLocaleString(), icon: <FilePlus className="text-emerald-400" /> },
                    { label: 'Neural Artifacts', value: currentStats.providers.antigravity.artifacts, icon: <Layers className="text-blue-400" /> },
                    { label: 'Runtime Stability', value: '99.9%', icon: <ShieldCheck className="text-amber-400" /> },
                  ].map(s => (
                    <div key={s.label} className="glass-card text-center group py-10">
                      <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-center mb-6 group-hover:border-accent/30 transition-all text-white">
                        {s.icon}
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">{s.label}</p>
                      <h3 className="text-5xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform">{s.value}</h3>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Heatmap */}
                  <div className="glass-card flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-3">
                          <ActivityIcon size={20} className="text-accent" /> 
                          NEURAL ACTIVITY
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">60-day intelligence heatmap</p>
                      </div>
                      <div className="px-4 py-1.5 rounded-full bg-slate-950 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Intelligence Mapping
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2.5 items-center justify-start h-full pb-6">
                      {Array.from({ length: 60 }).map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (59 - i));
                        const dateStr = d.toISOString().split('T')[0];
                        const dayData = (currentStats.timeline as any)?.[dateStr];
                        const count = dayData ? dayData.input + dayData.output : 0;
                        
                        let bgClass = "bg-white/5";
                        if (count > 0 && count < 50000) bgClass = "bg-cyan-950/40";
                        else if (count >= 50000 && count < 200000) bgClass = "bg-cyan-800/60";
                        else if (count >= 200000 && count < 500000) bgClass = "bg-cyan-600/80";
                        else if (count >= 500000) bgClass = "bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]";
                        
                        return (
                          <div 
                            key={dateStr} 
                            title={`${dateStr}: ${count.toLocaleString()} tokens`} 
                            className={`w-6 h-6 lg:w-7 lg:h-7 rounded-md ${bgClass} border border-white/5 hover:border-accent hover:scale-125 hover:z-10 transition-all cursor-crosshair`} 
                          />
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3 mt-auto pt-6 border-t border-white/5 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                      <span>Inert</span>
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded bg-white/5 border border-white/5" />
                        <div className="w-3 h-3 rounded bg-cyan-950/40 border border-white/5" />
                        <div className="w-3 h-3 rounded bg-cyan-800/60 border border-white/5" />
                        <div className="w-3 h-3 rounded bg-cyan-600/80 border border-white/5" />
                        <div className="w-3 h-3 rounded bg-cyan-400 border border-white/5" />
                      </div>
                      <span>Hyper-active</span>
                    </div>
                  </div>

                  {/* Tool Usage */}
                  <div className="glass-card">
                    <div className="flex items-center justify-between mb-12">
                      <h3 className="text-xl font-bold flex items-center gap-3">
                        <Code2 size={20} className="text-primary" /> 
                        PROTOCOL EXECUTION
                      </h3>
                      <div className="px-4 py-1.5 rounded-full bg-slate-950 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        TOP 14 INVOCATIONS
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                      {Object.entries(currentStats.toolUsage).sort((a: any, b: any) => b[1] - a[1]).slice(0, 14).map(([name, count]: any) => (
                        <div key={name} className="flex items-center gap-5 group">
                          <div className="w-10 h-10 rounded-xl bg-slate-950/60 text-slate-500 group-hover:text-accent group-hover:border-accent/30 border border-white/5 flex items-center justify-center transition-all shrink-0">
                            <ToolIcon name={name} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between mb-2 items-end">
                              <span className="text-[11px] font-black tracking-tight truncate text-slate-400 group-hover:text-white transition-colors uppercase">{name.replace('mcp_', '')}</span>
                              <span className="text-[10px] font-mono text-accent font-bold">{count.toLocaleString()}</span>
                            </div>
                            <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(count / (Object.values(currentStats.toolUsage)[0] as number)) * 100}%` }}
                                className="h-full bg-gradient-to-r from-accent to-primary" 
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
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="space-y-12 pb-20"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-5xl font-black italic tracking-tighter flex items-center gap-6 text-white uppercase">
                      <Trophy className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]" size={50} /> 
                      Intelligence Elite
                    </h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-4 ml-2">Top 15 Session Benchmarks</p>
                  </div>
                  <div className="px-6 py-2 rounded-xl bg-slate-900/60 border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Validated High Performance
                  </div>
                </div>
                
                <div className="grid gap-6">
                  {currentStats.topConversations.map((c: any, i: number) => (
                    <div 
                      key={c.id} 
                      className="glass-card flex flex-col lg:flex-row lg:items-center gap-8 group hover:translate-x-2 transition-all relative overflow-hidden"
                    >
                      {i < 3 && (
                        <div className="absolute top-0 right-0 px-4 py-1.5 bg-amber-400/10 text-amber-400 text-[9px] font-black tracking-[0.3em] rounded-bl-2xl border-l border-b border-amber-400/20 uppercase">
                          Tier 1 Performance
                        </div>
                      )}
                      <div className="text-4xl font-black text-slate-800 group-hover:text-accent transition-colors w-16 text-center italic shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black truncate text-2xl tracking-tight text-white group-hover:text-accent transition-colors uppercase italic">{c.title}</h4>
                        <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-600" />
                            <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">{c.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Briefcase size={14} className="text-accent/60" />
                            <span className="text-[10px] uppercase font-black text-accent tracking-widest">{pName(c.project)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap size={14} className="text-primary/60" />
                            <span className="text-[10px] uppercase font-black text-primary tracking-widest">{c.tokens.toLocaleString()} TKNS</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 lg:text-right shrink-0">
                        <div className="hidden sm:block">
                          <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">{c.tools} PROTOCOLS</p>
                          <div className="flex gap-1 justify-end">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <div key={idx} className={`h-1 w-4 rounded-full ${idx < (5 - i/3) ? 'bg-accent/40' : 'bg-white/5'}`} />
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-4xl font-black text-white group-hover:text-accent transition-colors tracking-tighter italic">
                            ${c.cost.toFixed(3)}
                          </div>
                        </div>
                        <ChevronRight size={24} className="text-slate-800 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="p-16 border-t border-white/5 bg-slate-950/60 mt-auto">
          <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8 opacity-40 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Cpu size={20} className="text-accent" />
              </div>
              <div>
                <span className="block text-xs font-black tracking-[0.4em] uppercase text-white">Antigravity Intelligence Protocol</span>
                <span className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">High-Precision Neural Monitoring · v2.8.4</span>
              </div>
            </div>
            <p className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase">
              ESTABLISHED FOR SUPERIOR COGNITIVE PERFORMANCE · {new Date().getFullYear()}
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
