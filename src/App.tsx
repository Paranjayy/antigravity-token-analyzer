import { useMemo, useState } from 'react';
import { 
  Coins, 
  Cpu, 
  MessageSquare, 
  Zap, 
  Terminal,
  FileCode,
  Layout,
  Search,
  ImageIcon,
  TrendingUp,
  Clock,
  ChevronRight,
  Layers,
  FilePlus,
  FileMinus,
  Briefcase,
  Box,
  Image as ImgIcon,
  Download
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
  if (name.includes('chrome') || name.includes('browser')) return <Layout size={18} />;
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

  const sortedTools = useMemo(() => {
    return Object.entries(currentStats.toolUsage)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10);
  }, [currentStats]);

  const projectData = useMemo(() => {
    return Object.entries(currentStats.projects)
      .map(([name, data]) => ({ name: name.replace(/"/g, ''), ...data }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 8);
  }, [currentStats]);

  const timelineData = currentStats.timelineArray || [];

  return (
    <div className="min-h-screen">
      <div className="bg-blobs">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <nav className="fixed left-0 top-0 h-full w-20 flex flex-col items-center py-8 gap-8 border-r border-white/5 bg-black/20 backdrop-blur-xl z-50">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 mb-4">
          <Cpu size={24} />
        </div>
        {[
          { id: 'overview', icon: <Layout size={20} /> },
          { id: 'projects', icon: <Briefcase size={20} /> },
          { id: 'engineering', icon: <Terminal size={20} /> },
          { id: 'assets', icon: <Box size={20} /> },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-4 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-white/10 text-accent shadow-inner' : 'text-white/40 hover:text-white/60'}`}
          >
            {tab.icon}
          </button>
        ))}
        <div className="mt-auto flex flex-col gap-4">
          <label className="p-4 text-white/20 hover:text-white/40 cursor-pointer">
            <TrendingUp size={20} />
            <input type="file" className="hidden" onChange={handleUpload} accept=".json" />
          </label>
          <button onClick={handleDownload} className="p-4 text-white/20 hover:text-white/40">
            <Download size={20} />
          </button>
        </div>
      </nav>

      <main className="pl-24 pr-8 py-8 max-w-7xl mx-auto">
        <header className="mb-12 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-bold tracking-tight text-gradient">Antigravity Insight</h1>
            <p className="text-sm font-medium text-white/40 mt-1 uppercase tracking-[0.2em]">Local Intelligence Engine v2.5</p>
          </motion.div>

          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-white/60">LIVE SYNC ACTIVE</span>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="stat-grid">
                {[
                  { label: 'Cloud Expenditure', value: `$${currentStats.totalCost.toFixed(2)}`, icon: <Coins className="text-yellow-400" />, sub: 'Aggregated LLM Cost' },
                  { label: 'Token Velocity', value: (currentStats.totalTokens.input + currentStats.totalTokens.output).toLocaleString(), icon: <Zap className="text-purple-400" />, sub: 'Total Throughput' },
                  { label: 'Active Projects', value: Object.keys(currentStats.projects).length, icon: <Briefcase className="text-blue-400" />, sub: 'Workspace Domains' },
                  { label: 'Session Count', value: currentStats.conversations, icon: <MessageSquare className="text-green-400" />, sub: 'Cross-platform History' },
                ].map((stat) => (
                  <div key={stat.label} className="glass-card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="rounded-xl bg-white/5 p-3">{stat.icon}</div>
                    </div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{stat.label}</p>
                    <h2 className="text-3xl font-bold mt-1">{stat.value}</h2>
                    <p className="text-[11px] text-white/20 mt-1">{stat.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 glass-card">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold">Usage Trajectory</h3>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-accent" />
                        <span className="text-[10px] text-white/40 uppercase font-bold">Cost ($)</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timelineData}>
                        <defs>
                          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.1)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }} />
                        <Area type="monotone" dataKey="cost" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-card">
                  <h3 className="text-xl font-bold mb-8">Token Share</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={tokenData} innerRadius={60} outerRadius={80} paddingAngle={10} dataKey="value">
                          {tokenData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-4 mt-4">
                    {tokenData.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                          <span className="text-sm text-white/60">{d.name}</span>
                        </div>
                        <span className="text-sm font-bold">{(((d.value as number) / (currentStats.totalTokens.input + currentStats.totalTokens.output)) * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div 
              key="projects"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div className="glass-card col-span-full">
                <h3 className="text-xl font-bold mb-8">Project Leaderboard</h3>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.4)" fontSize={12} width={150} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="tokens" fill="#818cf8" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {projectData.map((project, i) => (
                <div key={project.name} className="glass-card hover:bg-white/5 transition-colors group">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xl font-bold group-hover:text-accent transition-colors">{project.name}</h4>
                    <ChevronRight size={20} className="text-white/10 group-hover:text-accent" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
                      <p className="text-[10px] text-white/20 uppercase font-bold">Sessions</p>
                      <p className="text-2xl font-bold">{project.files}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
                      <p className="text-[10px] text-white/20 uppercase font-bold">Invested Cost</p>
                      <p className="text-2xl font-bold text-accent">${project.cost.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'engineering' && (
            <motion.div 
              key="engineering"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-8"
            >
              <div className="stat-grid">
                {[
                  { label: 'Files Modified', value: currentStats.providers.antigravity.filesChanged, icon: <FileCode className="text-purple-400" />, color: 'purple' },
                  { label: 'Lines Added', value: `+${currentStats.providers.antigravity.locAdded}`, icon: <FilePlus className="text-green-400" />, color: 'green' },
                  { label: 'Lines Removed', value: `-${currentStats.providers.antigravity.locRemoved}`, icon: <FileMinus className="text-red-400" />, color: 'red' },
                  { label: 'Media Assets', value: currentStats.mediaCount, icon: <ImgIcon className="text-blue-400" />, color: 'blue' },
                ].map((stat) => (
                  <div key={stat.label} className="glass-card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="rounded-xl bg-white/5 p-3">{stat.icon}</div>
                    </div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{stat.label}</p>
                    <h2 className={`text-4xl font-bold mt-1 text-${stat.color}-400`}>{stat.value}</h2>
                  </div>
                ))}
              </div>

              <div className="glass-card">
                <h3 className="text-xl font-bold mb-8">Engineering Workflow Density</h3>
                <div className="space-y-4">
                  {sortedTools.map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between p-4 rounded-2xl bg-white/2 border border-white/5">
                      <div className="flex items-center gap-4">
                        <ToolIcon name={name} />
                        <span className="text-sm font-medium">{name.replace('mcp_', '')}</span>
                      </div>
                      <div className="flex items-center gap-4 flex-1 max-w-md mx-8">
                        <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${(count as number / (sortedTools[0][1] as number)) * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-white/40">{count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'assets' && (
            <motion.div 
              key="assets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card"
            >
              <div className="flex items-center gap-4 mb-8">
                <Box className="text-accent" />
                <h3 className="text-xl font-bold">Conversation Artifacts</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10 flex flex-col items-center text-center">
                  <Layers size={48} className="text-purple-400 mb-4" />
                  <h4 className="text-3xl font-bold">{currentStats.providers.antigravity.artifacts}</h4>
                  <p className="text-sm text-white/40 uppercase tracking-widest mt-2">Unique Artifacts</p>
                </div>
                <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-500/10 to-accent/10 border border-white/10 flex flex-col items-center text-center">
                  <ImgIcon size={48} className="text-accent mb-4" />
                  <h4 className="text-3xl font-bold">{currentStats.mediaCount}</h4>
                  <p className="text-sm text-white/40 uppercase tracking-widest mt-2">Media Files</p>
                </div>
                <div className="p-8 rounded-3xl bg-gradient-to-br from-green-500/10 to-yellow-500/10 border border-white/10 flex flex-col items-center text-center">
                  <FileCode size={48} className="text-green-400 mb-4" />
                  <h4 className="text-3xl font-bold">{currentStats.providers.antigravity.filesChanged}</h4>
                  <p className="text-sm text-white/40 uppercase tracking-widest mt-2">Files Affected</p>
                </div>
              </div>
              <div className="mt-12 p-8 rounded-3xl border border-white/5 bg-white/2 text-center">
                <Clock className="mx-auto text-white/20 mb-4" size={32} />
                <h4 className="text-lg font-bold">Historical Data Integrity</h4>
                <p className="text-sm text-white/30 max-w-md mx-auto mt-2">We are currently scanning {currentStats.conversations} sessions across Antigravity and OpenCode. Artifact previews are cached locally.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
