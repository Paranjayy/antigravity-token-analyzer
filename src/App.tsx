import React, { useMemo } from 'react';
import { 
  Activity, 
  BarChart3, 
  Coins, 
  Cpu, 
  History, 
  MessageSquare, 
  Zap, 
  Terminal,
  FileCode,
  Layout,
  Search,
  Image as ImageIcon,
  CheckCircle2,
  TrendingUp,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { motion } from 'framer-motion';
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
  const tokenData = [
    { name: 'Input', value: stats.totalTokens.input },
    { name: 'Output', value: stats.totalTokens.output },
  ];

  const sortedTools = useMemo(() => {
    return Object.entries(stats.toolUsage)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10);
  }, []);

  const timelineData = stats.timelineArray || [];

  return (
    <div className="min-h-screen">
      <div className="bg-blobs">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <main className="container">
        <header className="mb-12 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/20">
              <Cpu size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Antigravity</h1>
              <p className="text-sm font-medium text-purple-400/80">Token Analyzer & Stats</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium backdrop-blur-md"
          >
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live Snapshot: {new Date().toLocaleDateString()}
          </motion.div>
        </header>

        <div className="stat-grid">
          {[
            { label: 'Total Estimated Cost', value: `$${stats.totalCost.toFixed(2)}`, icon: <Coins className="text-yellow-400" />, sub: 'Across all chats' },
            { label: 'Total Tokens', value: (stats.totalTokens.input + stats.totalTokens.output).toLocaleString(), icon: <Zap className="text-purple-400" />, sub: `${stats.totalTokens.input.toLocaleString()} in / ${stats.totalTokens.output.toLocaleString()} out` },
            { label: 'Conversations', value: stats.conversations, icon: <MessageSquare className="text-blue-400" />, sub: 'Local history scanned' },
            { label: 'Avg Cost/Chat', value: `$${(stats.totalCost / stats.conversations).toFixed(3)}`, icon: <Activity className="text-green-400" />, sub: 'Model: Gemini 3 Pro' },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-white/5 p-3">{stat.icon}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-white/50">{stat.label}</p>
                <h2 className="text-3xl font-bold">{stat.value}</h2>
                <p className="mt-1 text-xs text-white/30">{stat.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card mb-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-accent" />
              <h3 className="text-xl font-bold">Usage Timeline</h3>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => `$${v.toFixed(2)}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)'
                  }} 
                />
                <Area type="monotone" dataKey="cost" stroke="#c084fc" fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="glass-card"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Token Distribution</h3>
              <BarChart3 className="text-white/20" />
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tokenData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {tokenData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      borderRadius: '12px', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-8 mt-4">
                {tokenData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-sm text-white/60">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="glass-card"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Tool Execution Density</h3>
              <History className="text-white/20" />
            </div>
            <div className="tool-list">
              {sortedTools.map(([name, count], i) => (
                <div key={name} className="tool-item">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-white/60">
                      <ToolIcon name={name} />
                    </div>
                    <div>
                      <p className="tool-name">{name.replace('mcp_', '')}</p>
                      <div className="h-1 w-24 rounded-full bg-white/5 mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-accent" 
                          style={{ width: `${((count as number) / (sortedTools[0][1] as number)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <span className="tool-count">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card"
          >
            <div className="flex items-center gap-4 mb-8">
              <ShieldCheck className="text-blue-400" />
              <h3 className="text-xl font-bold">Model Context Limits</h3>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">Context Window</span>
                  <span className="font-bold">1M Tokens</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-blue-500 w-[12%]" />
                </div>
                <p className="text-[10px] text-white/30 mt-2">Max historical peaks reaching ~120k tokens.</p>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">Output Limit</span>
                  <span className="font-bold">64K Tokens</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-purple-500 w-[24%]" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-card"
          >
            <div className="flex items-center gap-4 mb-8">
              <Clock className="text-accent" />
              <h3 className="text-xl font-bold">System Integrity</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-xs text-white/40 uppercase">Parser Version</p>
                <p className="text-lg font-bold">v1.2.0-beta</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-xs text-white/40 uppercase">Data Source</p>
                <p className="text-lg font-bold">Local Logs</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-xs text-white/40 uppercase">Status</p>
                <p className="text-lg font-bold text-green-400">Synced</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-xs text-white/40 uppercase">Pricing</p>
                <p className="text-lg font-bold">models.dev</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default App;
