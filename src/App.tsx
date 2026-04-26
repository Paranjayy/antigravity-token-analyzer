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
  Clock,
  ChevronRight,
  Layers,
  FilePlus,
  Briefcase,
  Box,
  Download,
  AlertCircle,
  Trophy,
  Flame,
  Calendar,
  Activity as ActivityIcon,
  FolderOpen,
  RefreshCw,
  Code2
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import stats from './data/stats.json';

const COLORS = ['#c084fc', '#22d3ee', '#818cf8', '#f472b6', '#fbbf24'];

const ToolIcon = ({ name }: { name: string }) => {
  if (name.includes('file')) return <FileCode size={18} />;
  if (name.includes('command') || name.includes('terminal')) return <Terminal size={18} />;
  if (name.includes('search')) return <Search size={18} />;
  if (name.includes('image')) return <ImageIcon size={18} />;
  if (name.includes('chrome')) return <Layout size={18} />;
  return <Zap size={18} />;
};

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentStats, setCurrentStats] = useState(stats);

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentStats));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "antigravity_stats.json");
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
        } catch (err) {
          alert("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    }
  };

  const tokenData = [
    { name: 'Input', value: currentStats.totalTokens.input },
    { name: 'Output', value: currentStats.totalTokens.output },
  ];

  const projectData = useMemo(() => {
    return Object.entries(currentStats.projects)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => (b as any).tokens - (a as any).tokens)
      .slice(0, 10);
  }, [currentStats]);


  const [dateRange, setDateRange] = useState<'all'|'7'|'30'>('all');

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
  }, [currentStats, filteredTimeline, dateRange]);

  return (
    <div className="min-h-screen text-white selection:bg-accent/30 font-sans">
      <div className="bg-blobs">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <nav className="fixed left-0 top-0 h-full w-20 flex flex-col items-center py-8 gap-8 border-r border-white/5 bg-black/40 backdrop-blur-3xl z-50">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 mb-4 cursor-pointer hover:scale-110 transition-transform">
          <Cpu size={24} />
        </div>
        {[
          { id: 'overview', icon: <Layout size={20} />, label: 'Overview' },
          { id: 'projects', icon: <Briefcase size={20} />, label: 'Projects' },
          { id: 'engineering', icon: <ActivityIcon size={20} />, label: 'Engineering' },
          { id: 'halloffame', icon: <Trophy size={20} />, label: 'Top Sessions' },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
            className={`p-4 rounded-2xl transition-all relative group ${activeTab === tab.id ? 'bg-white/10 text-accent' : 'text-white/30 hover:text-white/60'}`}
          >
            {tab.icon}
            <div className="absolute left-full ml-4 px-3 py-1 bg-black text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100] border border-white/10">
              {tab.label}
            </div>
            {activeTab === tab.id && <motion.div layoutId="nav-glow" className="absolute inset-0 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.2)]" />}
          </button>
        ))}
        
        <div className="mt-auto flex flex-col gap-4">
          <label className="p-4 text-white/20 hover:text-white/40 cursor-pointer transition-colors relative group">
            <FolderOpen size={20} />
            <input type="file" className="hidden" onChange={handleUpload} accept=".json" />
            <div className="absolute left-full ml-4 px-3 py-1 bg-black text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100] border border-white/10">
              Import Stats JSON
            </div>
          </label>
          <button onClick={handleDownload} className="p-4 text-white/20 hover:text-white/40 transition-colors relative group">
            <Download size={20} />
            <div className="absolute left-full ml-4 px-3 py-1 bg-black text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100] border border-white/10">
              Export Stats JSON
            </div>
          </button>
        </div>
      </nav>

      <div className="ml-20 flex-1 flex flex-col min-h-screen">
        <main className="p-8 max-w-7xl mx-auto w-full flex flex-col flex-1">
        <header className="mb-12 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-6xl font-black tracking-tighter text-gradient italic leading-none">ANTIGRAVITY PRIME</h1>
            <div className="flex items-center gap-4 mt-4">
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] flex items-center gap-2">
                <ActivityIcon size={12} className="text-accent" /> Intelligence Protocol v2.5
              </span>
              <div className="h-[1px] w-12 bg-white/10" />
              <span className="text-[10px] font-bold text-accent/60 uppercase tracking-[0.4em]">Ready for Production</span>
            </div>
          </motion.div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value as any)}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-xs font-bold text-white/60 hover:text-white outline-none cursor-pointer uppercase tracking-widest"
              >
                <option value="all">All Time</option>
                <option value="30">Last 30 Days</option>
                <option value="7">Last 7 Days</option>
              </select>
              <div className="glass-card !py-2 !px-4 flex items-center gap-3 border-accent/20 bg-accent/5">
                <Flame size={16} className="text-orange-500" />
                <span className="text-xs font-black tracking-wider">{currentStats.conversations} ACTIVE SESSIONS</span>
              </div>
            </div>
            <p className="text-[9px] text-white/10 font-bold uppercase tracking-widest">Last Synced: Just Now</p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="ov" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {[
                  { label: 'Burn Rate', value: `$${filteredOverview?.cost.toFixed(2)}`, icon: <Coins />, color: 'text-yellow-400', sub: 'Total Investment' },
                  { label: 'Code Authored', value: (currentStats.gitLoc?.insertions || 0).toLocaleString(), icon: <FileCode />, color: 'text-pink-400', sub: 'Git Insertions (30d)' },
                  { label: 'Total Tokens', value: (filteredOverview?.tokens || 0).toLocaleString(), icon: <Zap />, color: 'text-purple-400', sub: 'Input + Output' },
                  { label: 'Input Prompts', value: (dateRange === 'all' ? currentStats.messageCount.input : filteredOverview.inputMessages).toLocaleString(), icon: <ActivityIcon />, color: 'text-blue-400', sub: 'User Invocations' },
                  { label: 'Stability', value: `${(((1 - ((filteredOverview?.errors || 0) / (currentStats.messageCount.output || 1))) * 100)).toFixed(1)}%`, icon: <AlertCircle />, color: 'text-green-400', sub: `${filteredOverview.errors} Errors Logged` },
                  { label: 'Tool Usage', value: (filteredOverview?.tools || 0).toLocaleString(), icon: <Terminal />, color: 'text-orange-400', sub: 'MCP Tool Calls' },
                ].map((s) => (
                  <div key={s.label} className="glass-card hover:border-accent/40 transition-all group cursor-default !p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2.5 rounded-xl bg-white/5 ${s.color} group-hover:scale-110 transition-transform`}>{s.icon}</div>
                    </div>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">{s.label}</p>
                    <h2 className="text-3xl font-black mt-1 tracking-tighter group-hover:text-accent transition-colors leading-none">{s.value}</h2>
                    <p className="text-[9px] text-white/10 mt-2 font-bold uppercase tracking-wider">{s.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Clock size={120} />
                  </div>
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-2"><Clock size={20} className="text-accent" /> Token Velocity Timeline</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={filteredTimeline}>
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis hide />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px' }} />
                        <Bar dataKey="input" stackId="a" fill="#c084fc" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="output" stackId="a" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="glass-card">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-2"><Box size={20} className="text-purple-400" /> Token Share</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={tokenData} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                          {tokenData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-8 space-y-4">
                    {tokenData.map((d, i) => (
                      <div key={d.name} className="flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ color: COLORS[i], backgroundColor: COLORS[i] }} />
                          <span className="text-sm font-bold text-white/40 group-hover:text-white/80 transition-colors">{d.name} Tokens</span>
                        </div>
                        <span className="font-black text-sm">{(d.value / 1e6).toFixed(1)}M</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div key="pj" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projectData.map((p: any) => (
                <div key={p.name} className="glass-card border-white/5 hover:border-accent/40 hover:bg-white/5 transition-all group">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-accent/10 text-accent group-hover:scale-110 transition-transform"><Briefcase size={18} /></div>
                      <h4 className="text-lg font-black tracking-tight truncate max-w-[180px]">{p.name}</h4>
                    </div>
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">{p.sessions} Sessions</div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black text-white/20 uppercase">Resource Allocation</span>
                        <span className="text-sm font-black text-accent">${p.cost.toFixed(2)}</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[2px]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(5, (p.cost / currentStats.totalCost) * 100)}%` }}
                          className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
                        <p className="text-[9px] text-white/20 font-black uppercase mb-1">Volume</p>
                        <p className="text-lg font-black tracking-tighter">{(p.tokens / 1000).toFixed(0)}k <span className="text-[10px] text-white/20 font-normal tracking-normal ml-1">tkns</span></p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
                        <p className="text-[9px] text-white/20 font-black uppercase mb-1">Stability</p>
                        <p className={`text-lg font-black tracking-tighter ${p.errors > 0 ? 'text-red-400' : 'text-green-400'}`}>{p.errors > 0 ? `-${p.errors}` : 'STABLE'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'engineering' && (
            <motion.div key="eng" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Files Impacted', value: currentStats.engineering.filesAffected, icon: <FileCode className="text-purple-400" /> },
                  { label: 'LOC Produced', value: currentStats.engineering.totalLOC.toLocaleString(), icon: <FilePlus className="text-green-400" /> },
                  { label: 'Artifact Density', value: currentStats.providers.antigravity.artifacts, icon: <Layers className="text-blue-400" /> },
                  { label: 'Sync Efficiency', value: '99.8%', icon: <RefreshCw className="text-yellow-400" /> },
                ].map(s => (
                  <div key={s.label} className="glass-card text-center group">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">{s.icon}</div>
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{s.label}</p>
                    <h3 className="text-4xl font-black mt-2 tracking-tighter group-hover:scale-110 transition-transform">{s.value}</h3>
                  </div>
                ))}
              </div>
              <div className="glass-card border-white/5">
                <div className="flex items-center justify-between mb-12">
                  <h3 className="text-xl font-bold flex items-center gap-2"><Code2 size={20} className="text-accent" /> Tool Execution Frequency</h3>
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest">
                    Real-time Mapping
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
                  {Object.entries(currentStats.toolUsage).sort((a: any, b: any) => b[1] - a[1]).slice(0, 14).map(([name, count]: any) => (
                    <div key={name} className="flex items-center gap-6 group">
                      <div className="p-3 rounded-xl bg-white/5 text-white/40 group-hover:text-accent group-hover:bg-accent/10 transition-all">
                        <ToolIcon name={name} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-black tracking-tight truncate">{name.replace('mcp_', '')}</span>
                          <span className="text-xs font-mono text-accent font-bold">{count.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(count / (Object.values(currentStats.toolUsage)[0] as number)) * 100}%` }}
                            className="h-full bg-gradient-to-r from-accent to-purple-500" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'halloffame' && (
            <motion.div key="hof" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <h2 className="text-4xl font-black italic tracking-tighter flex items-center gap-4">
                    <Trophy className="text-yellow-400" size={40} /> CONVERSATION HALL OF FAME
                  </h2>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mt-2 ml-14">Top Performance Benchmarks</p>
                </div>
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">Showing Top 15 Sessions</div>
              </div>
              <div className="grid gap-4">
                {currentStats.topConversations.map((c: any, i: number) => (
                  <div key={c.id} className="glass-card flex items-center gap-8 group hover:bg-white/5 hover:translate-x-2 cursor-default transition-all border-white/5 relative overflow-hidden">
                    {i < 3 && (
                      <div className="absolute top-0 right-0 p-1 px-3 bg-yellow-400/10 text-yellow-400 text-[8px] font-black tracking-[0.2em] rounded-bl-xl border-l border-b border-yellow-400/20">
                        ELITE PERFORMANCE
                      </div>
                    )}
                    <div className="text-3xl font-black text-white/5 group-hover:text-accent transition-colors w-12 text-center italic">#{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black truncate text-xl tracking-tight group-hover:text-white transition-colors">{c.title}</h4>
                      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
                        <span className="text-[9px] uppercase font-black text-white/20 flex items-center gap-1.5"><Calendar size={12} className="text-accent/40" /> {c.date}</span>
                        <span className="text-[9px] uppercase font-black text-accent flex items-center gap-1.5"><Briefcase size={12} className="text-accent" /> {pName(c.project)}</span>
                        <span className="text-[9px] uppercase font-black text-purple-400 flex items-center gap-1.5"><Zap size={12} className="text-purple-400" /> {c.tokens.toLocaleString()} tokens</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-white/80 group-hover:text-accent transition-colors">${c.cost.toFixed(3)}</div>
                      <div className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-1">{c.tools} tool executions</div>
                    </div>
                    <ChevronRight size={20} className="text-white/10 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </main>

        <footer className="p-12 border-t border-white/5 bg-black/60 mt-auto">
          <div className="max-w-7xl mx-auto flex justify-between items-center opacity-30 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Cpu size={16} className="text-accent" />
              </div>
              <span className="text-[10px] font-black tracking-[0.3em] uppercase">Antigravity Intelligence Protocol v2.5</span>
            </div>
            <p className="text-[9px] font-black tracking-widest text-white/40">DESIGNED FOR UNSTOPPABLE PRODUCTIVITY · {new Date().getFullYear()}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

const pName = (name: string) => name === '\"' || name === '' ? 'General' : name.replace(/"/g, '');

export default App;
