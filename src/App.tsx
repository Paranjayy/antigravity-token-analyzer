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
  MousePointer2,
  Calendar,
  Activity as ActivityIcon,
  FolderOpen
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
  Bar,
  Cell as ReCell
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

  const heatmapData = useMemo(() => {
    return currentStats.hourHeatmap.map((count: number, hour: number) => ({
      hour: `${hour}:00`,
      count
    }));
  }, [currentStats]);

  return (
    <div className="min-h-screen text-white selection:bg-accent/30">
      <div className="bg-blobs">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <nav className="fixed left-0 top-0 h-full w-20 flex flex-col items-center py-8 gap-8 border-r border-white/5 bg-black/20 backdrop-blur-3xl z-50">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 mb-4 cursor-pointer hover:scale-110 transition-transform">
          <Cpu size={24} />
        </div>
        {[
          { id: 'overview', icon: <Layout size={20} /> },
          { id: 'projects', icon: <Briefcase size={20} /> },
          { id: 'engineering', icon: <ActivityIcon size={20} /> },
          { id: 'halloffame', icon: <Trophy size={20} /> },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-4 rounded-2xl transition-all relative ${activeTab === tab.id ? 'bg-white/10 text-accent' : 'text-white/30 hover:text-white/60'}`}
          >
            {tab.icon}
            {activeTab === tab.id && <motion.div layoutId="nav-glow" className="absolute inset-0 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.2)]" />}
          </button>
        ))}
        <div className="mt-auto flex flex-col gap-4">
          <label className="p-4 text-white/20 hover:text-white/40 cursor-pointer transition-colors">
            <FolderOpen size={20} />
            <input type="file" className="hidden" onChange={handleUpload} accept=".json" />
          </label>
          <button onClick={handleDownload} className="p-4 text-white/20 hover:text-white/40 transition-colors">
            <Download size={20} />
          </button>
        </div>
      </nav>

      <main className="pl-24 pr-8 py-8 max-w-7xl mx-auto">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-black tracking-tighter text-gradient italic">ANTIGRAVITY PRIME</motion.h1>
            <p className="text-[10px] font-bold text-white/20 mt-2 uppercase tracking-[0.4em] flex items-center gap-2">
              <ActivityIcon size={12} className="text-accent" /> Professional Developer Analytics Engine
            </p>
          </div>
          <div className="flex gap-4">
            <div className="glass-card !py-2 !px-4 flex items-center gap-3 border-accent/20">
              <Flame size={16} className="text-orange-500" />
              <span className="text-xs font-black">{currentStats.conversations} Sessions Active</span>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
              <div className="stat-grid">
                {[
                  { label: 'Cloud Burn Rate', value: `$${currentStats.totalCost.toFixed(2)}`, icon: <Coins />, color: 'text-yellow-400', sub: 'Total LLM Investment' },
                  { label: 'Token Throughput', value: (currentStats.totalTokens.input + currentStats.totalTokens.output).toLocaleString(), icon: <Zap />, color: 'text-purple-400', sub: 'Input + Output' },
                  { label: 'Error Resilience', value: `${(((1 - (currentStats.providers.antigravity.errors / (currentStats.messageCount.output || 1))) * 100)).toFixed(1)}%`, icon: <AlertCircle />, color: 'text-green-400', sub: 'Success vs Failure' },
                  { label: 'Tool Multiplier', value: `x${(Object.values(currentStats.toolUsage).reduce((a: any, b: any) => a + b, 0) as number / currentStats.conversations).toFixed(1)}`, icon: <MousePointer2 />, color: 'text-blue-400', sub: 'Tools per Session' },
                ].map((s) => (
                  <div key={s.label} className="glass-card hover:border-white/20 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-white/5 ${s.color}`}>{s.icon}</div>
                    </div>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{s.label}</p>
                    <h2 className="text-3xl font-black mt-1 group-hover:scale-105 transition-transform origin-left">{s.value}</h2>
                    <p className="text-[10px] text-white/10 mt-1">{s.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-2"><Clock size={20} className="text-accent" /> Hourly Velocity Heatmap</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={heatmapData}>
                        <XAxis dataKey="hour" stroke="rgba(255,255,255,0.1)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis hide />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px' }} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {heatmapData.map((entry: any, index: number) => (
                            <ReCell key={`cell-${index}`} fill={entry.count > 5 ? '#22d3ee' : '#ffffff10'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="glass-card">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-2"><Box size={20} className="text-purple-400" /> Token Distribution</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={tokenData} innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                          {tokenData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-3">
                    {tokenData.map((d, i) => (
                      <div key={d.name} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                          <span className="text-white/40">{d.name}</span>
                        </div>
                        <span className="font-bold">{(d.value / 1e6).toFixed(1)}M</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div key="pj" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projectData.map((p: any) => (
                <div key={p.name} className="glass-card border-white/5 hover:border-accent/40 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-bold truncate pr-4">{p.name}</h4>
                    <div className="p-2 rounded-lg bg-accent/10 text-accent"><Briefcase size={16} /></div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/20">Cost Contribution</span>
                      <span className="font-bold text-accent">${p.cost.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${(p.cost / currentStats.totalCost) * 100}%` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="p-3 rounded-xl bg-white/2 border border-white/5">
                        <p className="text-[10px] text-white/20 font-bold uppercase">Tokens</p>
                        <p className="text-sm font-bold">{(p.tokens / 1000).toFixed(0)}k</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/2 border border-white/5">
                        <p className="text-[10px] text-white/20 font-bold uppercase">Errors</p>
                        <p className="text-sm font-bold text-red-400">{p.errors || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'engineering' && (
            <motion.div key="eng" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                  { label: 'Files Impacted', value: currentStats.engineering.filesAffected, icon: <FileCode className="text-purple-400" /> },
                  { label: 'Lines of Code', value: currentStats.engineering.totalLOC.toLocaleString(), icon: <FilePlus className="text-green-400" /> },
                  { label: 'Artifact Density', value: currentStats.providers.antigravity.artifacts, icon: <Layers className="text-blue-400" /> },
                  { label: 'Avg Tools/Msg', value: (Object.values(currentStats.toolUsage).reduce((a: any, b: any) => a + b, 0) as number / (currentStats.messageCount.output || 1)).toFixed(1), icon: <Zap className="text-yellow-400" /> },
                ].map(s => (
                  <div key={s.label} className="glass-card text-center">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">{s.icon}</div>
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{s.label}</p>
                    <h3 className="text-3xl font-black mt-1">{s.value}</h3>
                  </div>
                ))}
              </div>
              <div className="glass-card">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-2"><Terminal size={20} className="text-accent" /> Advanced Tool Stack Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {Object.entries(currentStats.toolUsage).sort((a: any, b: any) => b[1] - a[1]).slice(0, 12).map(([name, count]: any) => (
                    <div key={name} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                      <ToolIcon name={name} />
                      <div className="flex-1">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-bold">{name.replace('mcp_', '')}</span>
                          <span className="text-xs text-white/40 font-mono">{count}</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-accent to-purple-500" style={{ width: `${(count / (Object.values(currentStats.toolUsage)[0] as number)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'halloffame' && (
            <motion.div key="hof" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center gap-4 mb-8">
                <Trophy className="text-yellow-400" size={32} />
                <h2 className="text-3xl font-black italic">CONVERSATION HALL OF FAME</h2>
              </div>
              <div className="grid gap-4">
                {currentStats.topConversations.map((c: any, i: number) => (
                  <div key={c.id} className="glass-card flex items-center gap-6 group hover:bg-white/5 cursor-default transition-all">
                    <div className="text-2xl font-black text-white/10 group-hover:text-accent transition-colors">#{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate text-lg">{c.title}</h4>
                      <div className="flex gap-4 mt-2">
                        <span className="text-[10px] uppercase font-bold text-white/20 flex items-center gap-1"><Calendar size={10} /> {c.date}</span>
                        <span className="text-[10px] uppercase font-bold text-accent flex items-center gap-1"><Briefcase size={10} /> {c.project}</span>
                        <span className="text-[10px] uppercase font-bold text-purple-400 flex items-center gap-1"><Zap size={10} /> {c.tokens.toLocaleString()} tokens</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-white/80">${c.cost.toFixed(3)}</div>
                      <div className="text-[10px] text-white/20 font-bold uppercase">{c.tools} tool calls</div>
                    </div>
                    <ChevronRight size={20} className="text-white/10 group-hover:text-accent" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="pl-24 pr-8 py-12 border-t border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-3">
            <Cpu size={20} className="text-accent" />
            <span className="text-xs font-bold tracking-widest uppercase">Antigravity Intelligence Protocol</span>
          </div>
          <p className="text-[10px] font-medium tracking-tighter">ENGINEERED FOR THE 1% · NO PLACEHOLDERS · PURE DATA</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
