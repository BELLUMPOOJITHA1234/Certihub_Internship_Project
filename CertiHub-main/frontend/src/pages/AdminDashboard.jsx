import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Activity, 
  ArrowUpRight, 
  Cpu, 
  Globe, 
  Clock, 
  Zap,
  TrendingUp,
  Search,
  Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { auth } from '../firebase/firebase';
import '../styles/print.css';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } } };

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('1M');

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async (range = '1M') => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/stats?range=${range}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!cancelled) setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        toast.error("Failed to sync system analytics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStats(timeRange);
    
    const interval = setInterval(() => {
      fetchStats(timeRange);
    }, 30000);
    
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [timeRange]);

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        <header className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-brand-600 dark:text-brand-400">
              <Zap className="h-4 w-4" />
              Administrative Command
            </div>
            <h1 className="mt-2 text-5xl font-black tracking-tight text-slate-950 dark:text-white">
              System Analytics
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm dark:bg-white/5 dark:text-slate-300">
              <Clock className="h-4 w-4" />
              Last sync: Just now
            </div>
            <button 
              onClick={() => window.print()}
              className="btn-primary flex items-center gap-2 rounded-2xl px-6 py-2.5 print:hidden"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </header>

        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={fadeUp}>
            <StatCard 
              icon={<Users className="h-6 w-6" />}
              label="Total Ecosystem Users"
              value={stats?.totalUsers || 0}
              trend="+12.4%"
              color="indigo"
              chartData={[30, 45, 35, 60, 55, 80]}
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <StatCard 
              icon={<FileText className="h-6 w-6" />}
              label="Verified Certificates"
              value={stats?.totalCertificates || 0}
              trend="+8.2%"
              color="brand"
              chartData={[20, 30, 45, 40, 65, 75]}
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <StatCard 
              icon={<CheckCircle className="h-6 w-6" />}
              label="AI Verification Rate"
              value="99.4%"
              trend="Stable"
              color="teal"
              chartData={[98, 99, 99.2, 99.4, 99.3, 99.4]}
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <StatCard 
              icon={<TrendingUp className="h-6 w-6" />}
              label="Skill Extractions"
              value={(stats?.totalCertificates || 0) * 8}
              trend="+18%"
              color="amber"
              chartData={[40, 50, 45, 70, 85, 95]}
            />
          </motion.div>
        </motion.div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="card h-full p-8 rounded-[2.5rem]">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white">Certificate Growth</h2>
                  <p className="text-sm text-slate-500">Monthly breakdown of uploaded credentials.</p>
                </div>
                <div className="flex gap-2">
                  {['7D', '1M', '3M', '1Y', 'ALL'].map(t => (
                    <button 
                      key={t} 
                      onClick={() => setTimeRange(t)}
                      className={`px-3 py-1 text-xs font-black rounded-lg transition ${timeRange === t ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                <GrowthChart key={timeRange} data={stats?.growthData || []} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card h-full p-8 rounded-[2.5rem]">
              <h2 className="mb-6 text-2xl font-black text-slate-950 dark:text-white">System Health</h2>
              
              <div className="space-y-6">
                <HealthMetric 
                  icon={<Globe className="h-5 w-5" />} 
                  label="Network Latency" 
                  value={stats?.health?.latency || '0ms'} 
                  status="Excellent"
                  color="teal"
                />
                <HealthMetric 
                  icon={<Cpu className="h-5 w-5" />} 
                  label="Process Load" 
                  value={`${stats?.health?.cpuLoad || '0%'}`} 
                  status={`RAM: ${stats?.health?.memory || '0MB'}`}
                  color="blue"
                />
                <HealthMetric 
                  icon={<Activity className="h-5 w-5" />} 
                  label="API Uptime" 
                  value={stats?.health?.uptime || '0%'} 
                  status="Active"
                  color="indigo"
                />
                
                <div className="mt-8 rounded-2xl bg-slate-50 p-6 dark:bg-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-slate-500">Node Status</span>
                    <span className="flex items-center gap-1.5 text-xs font-black text-teal-600">
                      <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                      OPERATIONAL
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className={`h-6 w-1 flex-1 rounded-full ${i > 15 ? 'bg-slate-200 dark:bg-white/10' : 'bg-teal-400'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="card p-8 rounded-[2.5rem]">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-950 dark:text-white">Credential Feed</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search logs..." 
                    className="w-64 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm font-medium focus:border-brand-500 focus:outline-none dark:border-white/10 dark:bg-white/5"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-400 dark:border-white/5">
                      <th className="pb-4 pr-4">Certificate</th>
                      <th className="pb-4 pr-4">Issuer</th>
                      <th className="pb-4 pr-4">Processed</th>
                      <th className="pb-4">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {stats?.recentActivity.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase())).map((act) => (
                      <tr key={act.id} className="group transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                        <td className="py-4 pr-4">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{act.title}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-black">ID: {act.id.substring(0, 8)}...</div>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                            {act.issuer}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-xs text-slate-500">
                          {new Date(act.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4">
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-teal-600">
                            <CheckCircle className="h-3 w-3" />
                            SUCCESS
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card p-8 rounded-[2.5rem]">
              <h2 className="mb-6 text-2xl font-black text-slate-950 dark:text-white">Issuer Share</h2>
              <div className="space-y-6">
                {Object.entries(stats?.issuerDistribution || {}).sort((a,b) => b[1] - a[1]).slice(0, 6).map(([issuer, count], idx) => (
                  <div key={issuer} className="group cursor-pointer">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{issuer}</span>
                      <span className="font-black text-brand-600">{count}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div 
                        className={`h-full ${['bg-brand-500', 'bg-teal-500', 'bg-amber-500', 'bg-indigo-500', 'bg-blue-500', 'bg-rose-500'][idx % 6]}`}
                        style={{ width: `${(count / (stats?.totalCertificates || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 rounded-3xl bg-gradient-to-br from-brand-600 to-indigo-700 p-6 text-white shadow-lg shadow-brand-500/20">
                <p className="text-xs font-black uppercase tracking-widest opacity-80">Pro Insight</p>
                <p className="mt-3 text-sm font-bold leading-relaxed">
                  Most users are upskilling in <strong>Web Development</strong> and <strong>Cloud Computing</strong> this month.
                </p>
                <button className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:underline">
                  View full trends <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, trend, color, chartData }) => {
  const colorMap = {
    brand: 'bg-brand-500 shadow-brand-500/20 text-brand-600',
    indigo: 'bg-indigo-500 shadow-indigo-500/20 text-indigo-600',
    teal: 'bg-teal-500 shadow-teal-500/20 text-teal-600',
    amber: 'bg-amber-500 shadow-amber-500/20 text-amber-600',
  };

  return (
    <div className="card relative overflow-hidden rounded-[2.5rem] p-6 transition-all hover:-translate-y-1">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-white ${colorMap[color].split(' ')[0]}`}>
        {icon}
      </div>
      <div className="relative z-10">
        <div className="text-3xl font-black text-slate-950 dark:text-white">{value.toLocaleString()}</div>
        <div className="mt-1 text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30">
        <svg viewBox="0 0 100 30" className="h-full w-full" preserveAspectRatio="none">
          <path
            d={`M 0 30 ${chartData.map((v, i) => `L ${i * (100 / (chartData.length - 1))} ${30 - v/4}`).join(' ')} L 100 30 Z`}
            fill={`url(#gradient-${color})`}
            stroke="none"
          />
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" className={colorMap[color].split(' ')[2]} />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" className={colorMap[color].split(' ')[2]} />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className={`text-[10px] font-black uppercase tracking-wider ${colorMap[color].split(' ')[2]}`}>
          {trend}
        </div>
        <div className="rounded-full bg-slate-50 p-1 dark:bg-white/5">
          <ArrowUpRight className="h-3 w-3 text-slate-400" />
        </div>
      </div>
    </div>
  );
};

const HealthMetric = ({ icon, label, value, status, color }) => {
  const colorMap = {
    teal: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20',
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]}`}>
          {icon}
        </div>
        <div>
          <div className="text-sm font-black text-slate-900 dark:text-white">{label}</div>
          <div className="text-xs font-bold text-slate-400">{status}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-black text-slate-900 dark:text-white">{value}</div>
      </div>
    </div>
  );
};

const GrowthChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map(d => d.count), 5);
  const width = 1000;
  const height = 300;
  
  const points = data.map((d, i) => ({
    x: i * (width / (data.length - 1 || 1)),
    y: height - (d.count / max) * height
  }));

  const createBezierPath = (pts) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 2;
      const cp2x = curr.x + (next.x - curr.x) / 2;
      d += ` C ${cp1x} ${curr.y}, ${cp2x} ${next.y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const linePath = createBezierPath(points);
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="relative h-full w-full pt-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <line 
            key={v} 
            x1="0" y1={v * height} 
            x2={width} y2={v * height} 
            className="stroke-slate-200 dark:stroke-white/5" 
            strokeWidth="1" 
            strokeDasharray="5,5"
          />
        ))}
        
        <path
          d={areaPath}
          fill="url(#area-gradient)"
          className="animate-[fadeIn_1.5s_ease-out_forwards]"
        />
        
        <path
          d={linePath}
          fill="none"
          stroke="url(#line-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
          filter="url(#glow)"
          className="opacity-20 animate-[drawLine_2s_ease-in-out_forwards]"
        />

        <path
          d={linePath}
          fill="none"
          stroke="url(#line-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-[drawLine_1.5s_ease-in-out_forwards]"
        />

        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="8"
              className="fill-white dark:fill-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"
            />
            <circle
              cx={p.x}
              cy={p.y}
              r="5"
              className="fill-brand-500 stroke-white dark:stroke-slate-900"
              strokeWidth="2"
            />
          </g>
        ))}
      </svg>
      
      <div className="mt-6 flex justify-between px-2">
        {data.map((d, i) => (
          <span key={i} className="text-[11px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-500">
            {d.month}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;