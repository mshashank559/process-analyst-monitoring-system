import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckSquare, Clock, CheckCircle, Users, UserCheck,
  FileText, AlertCircle, AlertTriangle
} from 'lucide-react'
import { useAnimatedCounter } from '../hooks/useAnimatedCounter'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'

interface Stats {
  todaysTasks: number; pendingTasks: number; completedTasks: number;
  recruitersMonitored: number; candidatesMonitored: number;
  pendingReports: number; openIssues: number; warningCandidates: number;
}

const CARDS = [
  { key: 'todaysTasks',        label: "Today's Tasks",       icon: CheckSquare,  color: '#1E22D0' },
  { key: 'pendingTasks',       label: 'Pending Tasks',        icon: Clock,        color: '#eab308' },
  { key: 'completedTasks',     label: 'Completed Tasks',      icon: CheckCircle,  color: '#22c55e' },
  { key: 'recruitersMonitored',label: 'Recruiters Monitored', icon: Users,        color: '#06b6d4' },
  { key: 'candidatesMonitored',label: 'Candidates Monitored', icon: UserCheck,    color: '#8b5cf6' },
  { key: 'pendingReports',     label: 'Pending Reports',      icon: FileText,     color: '#f97316' },
  { key: 'openIssues',         label: 'Open Issues',          icon: AlertCircle,  color: '#ef4444' },
  { key: 'warningCandidates',  label: 'Warning Candidates',   icon: AlertTriangle,color: '#f59e0b' },
] as const

function StatCard({ label, icon: Icon, value, color }: { label: string; icon: any; value: number; color: string }) {
  const animated = useAnimatedCounter(value)
  return (
    <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }}>
      <div className="stat-card-icon" style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}>
        <Icon />
      </div>
      <div className="stat-card-value">{animated}</div>
      <div className="stat-card-label">{label}</div>
    </motion.div>
  )
}

const EMPTY_STATS: Stats = {
  todaysTasks: 0, pendingTasks: 0, completedTasks: 0,
  recruitersMonitored: 0, candidatesMonitored: 0,
  pendingReports: 0, openIssues: 0, warningCandidates: 0
}

const TOOLTIP_STYLE = {
  background: '#0d0d35',
  border: '1px solid rgba(30,34,208,0.4)',
  borderRadius: 8,
  fontSize: 12,
}

const EMPTY_CHART_MSG = (
  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
    No data yet — add recruiters to see charts
  </div>
)

export default function Dashboard() {
  const [stats, setStats]       = useState<Stats>(EMPTY_STATS)
  const [barData, setBarData]   = useState<{ name: string; target: number; actual: number }[]>([])
  const [areaData, setAreaData] = useState<{ name: string; apps: number }[]>([])

  useEffect(() => {
    // Stats
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(d => { if (d && typeof d === 'object') setStats(d) })
      .catch(() => {})

    // Real recruiter data for bar chart
    fetch('/api/recruiters')
      .then(r => r.json())
      .then((d: any[]) => {
        if (Array.isArray(d) && d.length) {
          setBarData(d.map(r => ({
            name: r.name?.split(' ')[0] || '—',
            target: r.target || 0,
            actual: r.actual || 0,
          })))
        }
      })
      .catch(() => {})

    // Real task data by day for area chart
    fetch('/api/tasks')
      .then(r => r.json())
      .then((d: any[]) => {
        if (Array.isArray(d) && d.length) {
          const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
          const counts: Record<string, number> = {}
          days.forEach(day => { counts[day] = 0 })
          d.forEach(t => {
            if (t.createdAt) {
              const day = days[new Date(t.createdAt).getDay() === 0 ? 6 : new Date(t.createdAt).getDay() - 1]
              counts[day] = (counts[day] || 0) + 1
            }
          })
          setAreaData(days.map(name => ({ name, apps: counts[name] })))
        }
      })
      .catch(() => {})
  }, [])

  const greetingHour = new Date().getHours()
  const greeting = greetingHour < 12 ? '☀️ Good Morning' : greetingHour < 17 ? '🌤 Good Afternoon' : '🌙 Good Evening'

  return (
    <div>
      {/* Hero */}
      <motion.div className="hero-section" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="hero-greeting">{greeting}</div>
        <div className="hero-title">Welcome back, <span>Shashank</span></div>
        <div className="hero-sub">Monitor recruiters, candidates, reports and operational activities in one place.</div>
        <div className="hero-badge"><span />Live · All Systems Operational</div>
      </motion.div>

      {/* Stat Cards */}
      <div className="cards-grid">
        {CARDS.map((c, i) => (
          <motion.div key={c.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <StatCard label={c.label} icon={c.icon} value={stats[c.key as keyof Stats]} color={c.color} />
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>📋 Tasks Created This Week</h3>
          {areaData.length === 0 ? EMPTY_CHART_MSG : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1E22D0" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1E22D0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="apps" stroke="#1E22D0" fill="url(#ga)" strokeWidth={2} name="Tasks" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>🎯 Target vs Actual (Recruiters)</h3>
          {barData.length === 0 ? EMPTY_CHART_MSG : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="target" fill="rgba(30,34,208,0.5)" radius={[4,4,0,0]} name="Target" />
                <Bar dataKey="actual" fill="#1E22D0"              radius={[4,4,0,0]} name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
