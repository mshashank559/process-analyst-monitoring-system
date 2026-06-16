import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Download } from 'lucide-react'

interface Record { _id: string; name?: string; title?: string; status?: string; createdAt?: string; type?: string }

export default function HistoricalRecords() {
  const [data, setData] = useState<{ recruiters: Record[]; candidates: Record[]; tasks: Record[]; issues: Record[] }>({ recruiters: [], candidates: [], tasks: [], issues: [] })
  const [tab, setTab] = useState<'recruiters' | 'candidates' | 'tasks' | 'issues'>('recruiters')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/historical')
      .then(r => r.json())
      .then(d => { if (d && d.recruiters) setData(d) })
      .catch(() => {})
  }, [])

  const current = data[tab]
  const filtered = current.filter(r => {
    const q = search.toLowerCase()
    return !q || (r.name || r.title || '').toLowerCase().includes(q)
  })

  const exportCSV = () => {
    const rows = filtered.map(r => [r.name || r.title || '', r.status || '', r.createdAt || ''].join(','))
    const csv = ['Name/Title,Status,Date', ...rows].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `${tab}_history.csv`; a.click()
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div><h1>Historical Records</h1><p>Search and export historical data</p></div>
          <button className="btn btn-outline" onClick={exportCSV}><Download size={14} />Export CSV</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['recruiters', 'candidates', 'tasks', 'issues'] as const).map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="glass-card">
        <div className="filter-bar">
          <div className="header-search" style={{ width: 260 }}>
            <Search size={15} />
            <input placeholder="Search records…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Name / Title</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {filtered.map((r, i) => (
                <motion.tr key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{r.name || r.title}</td>
                  <td><span className="tag">{r.status}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                </motion.tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
