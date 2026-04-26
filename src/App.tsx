import { useMemo } from 'react';
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
  ImageIcon,
  TrendingUp,
  Clock,
  ShieldCheck,
  ChevronRight,
  Database as DbIcon,
  Layers
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
  Area
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
              <h1 className="text-3xl font-bold tracking-tight">Antigravity Analyzer</h1>
              <p className="text-sm font-medium text-purple-400/80">Premium Usage Intelligence</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-white/60">System Sync:</span> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </motion.div>
        </header>

        {/* Global Stats Grid */}
        <div className="stat-grid">
          {[
            { label: 'Total Expenditure', value: `$${stats.totalCost.toFixed(2)}`, icon: <Coins className="text-yellow-400" />, sub: 'Aggregated across providers' },
            { label: 'Token Throughput', value: (stats.totalTokens.input + stats.totalTokens.output).toLocaleString(), icon: <Zap className="text-purple-400" />, sub: `${stats.totalTokens.input.toLocaleString()} in / ${stats.totalTokens.output.toLocaleString()} out` },
            { label: 'Session Velocity', value: stats.conversations, icon: <MessageSquare className="text-blue-400" />, sub: `${stats.messageCount.input.toLocaleString()} queries / ${stats.messageCount.output.toLocaleString()} responses` },
            { label: 'Model Efficiency', value: `$${(stats.totalCost / stats.conversations).toFixed(3)}`, icon: <Activity className="text-green-400" />, sub: 'Avg. cost per interaction' },
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
                <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Real-time</div>
              </div>
              <div>
                <p className="text-xs font-bold text-white/40 uppercase tracking-wider">{stat.label}</p>
                <h2 className="text-3xl font-bold mt-1">{stat.value}</h2>
                <p className="mt-1 text-[11px] text-white/30">{stat.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Providers Section */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <DbIcon className="text-white/40" size={20} />
            <h3 className="text-lg font-bold uppercase tracking-widest text-white/60">Active Providers</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(stats.providers).map(([name, data], i) => (
              <motion.div 
                key={name}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="glass-card relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Layers size={80} />
                </div>
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-bold capitalize">{name}</h4>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-white/5 text-white/40">Connected</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-white/30 uppercase">Sessions</p>
                    <p className="text-lg font-bold">{data.conversations}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase">Tokens</p>
                    <p className="text-lg font-bold">{(data.tokens.input + data.tokens.output).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase">Cost</p>
                    <p className="text-lg font-bold text-accent">${data.cost.toFixed(2)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Timeline Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card mb-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-accent" />
              <h3 className="text-xl font-bold">Historical Trajectory</h3>
            </div>
            <div className="flex gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-[10px] text-white/40 uppercase font-bold">Expenditure Trend</span>
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
                  stroke="rgba(255,255,255,0.1)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.1)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(5,5,5,0.9)', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(20px)',
                    fontSize: '12px'
                  }} 
                />
                <Area type="monotone" dataKey="cost" stroke="#c084fc" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Tool Distribution */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="glass-card"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Tool Execution Heatmap</h3>
              <BarChart3 className="text-white/20" />
            </div>
            <div className="tool-list">
              {sortedTools.map(([name, count]) => (
                <div key={name} className="tool-item group cursor-pointer hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-white/40 group-hover:text-accent transition-colors">
                      <ToolIcon name={name} />
                    </div>
                    <div>
                      <p className="tool-name text-sm">{name.replace('mcp_', '')}</p>
                      <div className="h-1 w-32 rounded-full bg-white/5 mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-accent" 
                          style={{ width: `${((count as number) / (sortedTools[0][1] as number)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tool-count text-sm">{count.toLocaleString()}</span>
                    <ChevronRight size={14} className="text-white/10" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Model Context & Integrity */}
          <div className="flex flex-col gap-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="glass-card"
            >
              <div className="flex items-center gap-4 mb-8">
                <ShieldCheck className="text-blue-400" />
                <h3 className="text-xl font-bold">Operational Thresholds</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/40 uppercase font-bold">Primary Context Window</span>
                    <span className="font-bold text-accent">1M Tokens</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-accent w-[12%] shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/40 uppercase font-bold">Peak Output Buffer</span>
                    <span className="font-bold text-purple-400">64K Tokens</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-purple-500 w-[24%] shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="glass-card"
            >
              <div className="flex items-center gap-4 mb-8">
                <Clock className="text-accent" />
                <h3 className="text-xl font-bold">Session Integrity</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { l: 'Parser', v: 'v2.1.0' },
                  { l: 'Providers', v: 'Multi-Core' },
                  { l: 'Status', v: 'Synchronized', c: 'text-green-400' },
                  { l: 'Metrics', v: 'High Fidelity' }
                ].map(item => (
                  <div key={item.l} className="p-4 rounded-2xl bg-white/2 border border-white/5">
                    <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">{item.l}</p>
                    <p className={`text-sm font-bold mt-1 ${item.c || 'text-white'}`}>{item.v}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
