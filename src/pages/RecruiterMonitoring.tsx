import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, X } from 'lucide-react'

interface Recruiter {
  _id: string; name: string; teamLead: string; candidate: string;
  target: number; actual: number; longApps: number; shortApps: number; status: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  achieved: { label: 'Target Achieved', cls: 'badge-green' },
  below_target: { label: 'Below Target', cls: 'badge-yellow' },
  missed: { label: 'Target Missed', cls: 'badge-red' },
}

export default function RecruiterMonitoring() {
  const [data, setData] = useState<Recruiter[]>([])
  const [search, setSearch] = useState('')
  const [filterTL, setFilterTL] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '', teamLead: 'Shilp', candidate: '',
    target: 8, actual: 0, longApps: 0, shortApps: 0
  })

  const fetchRecruiters = () => {
    fetch('/api/recruiters')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setData(d) })
      .catch(() => {})
  }

  useEffect(() => {
    fetchRecruiters()
  }, [])

  const filtered = data.filter(r => {
    const q = search.toLowerCase()
    const matchQ = !q || r.name.toLowerCase().includes(q) || (r.candidate && r.candidate.toLowerCase().includes(q))
    const matchTL = !filterTL || r.teamLead === filterTL
    const matchS = !filterStatus || r.status === filterStatus
    return matchQ && matchTL && matchS
  })
  
  const leads = [...new Set(data.map(r => r.teamLead))]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Calculate status based on actual vs target
    let status = 'missed'
    if (form.actual >= form.target) {
      status = 'achieved'
    } else if (form.actual >= form.target * 0.6) {
      status = 'below_target'
    }

    const payload = { ...form, status }

    fetch('/api/recruiters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(() => {
        fetchRecruiters()
        setShowModal(false)
        setForm({
          name: '', teamLead: 'Shilp', candidate: '',
          target: 8, actual: 0, longApps: 0, shortApps: 0
        })
      })
      .catch(err => console.error(err))
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Recruiter Monitoring</h1>
            <p>Track recruiter performance against daily targets</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} />Add Recruiter
          </button>
        </div>
      </div>

      <div className="glass-card">
        <div className="filter-bar">
          <div className="header-search" style={{ width: 220 }}>
            <Search size={15} />
            <input placeholder="Search recruiter or candidate…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-input" value={filterTL} onChange={e => setFilterTL(e.target.value)}>
            <option value="">All Team Leads</option>
            {leads.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select className="filter-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="achieved">Target Achieved</option>
            <option value="below_target">Below Target</option>
            <option value="missed">Target Missed</option>
          </select>
          {(search || filterTL || filterStatus) && (
            <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setFilterTL(''); setFilterStatus('') }}>Clear</button>
          )}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Recruiter</th><th>Team Lead</th><th>Candidate</th>
                <th>Target</th><th>Actual</th><th>Long Apps</th><th>Short Apps</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const s = STATUS_MAP[r.status]
                return (
                  <motion.tr key={r._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td><span className="tag">{r.teamLead}</span></td>
                    <td>{r.candidate || '—'}</td>
                    <td><b>{r.target}</b></td>
                    <td style={{ color: r.actual >= r.target ? 'var(--green)' : r.actual >= r.target * 0.6 ? 'var(--yellow)' : 'var(--red)', fontWeight: 700 }}>{r.actual}</td>
                    <td>{r.longApps}</td>
                    <td>{r.shortApps}</td>
                    <td><span className={`badge ${s?.cls || 'badge-blue'}`}>{s?.label || r.status}</span></td>
                  </motion.tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div
            className="modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 500 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3>Add New Recruiter</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Recruiter Name</label>
                <input
                  className="form-control"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ravi Kumar"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Team Lead</label>
                  <select
                    className="form-control"
                    value={form.teamLead}
                    onChange={e => setForm({ ...form, teamLead: e.target.value })}
                  >
                    <option value="Shilp">Shilp</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Candidate Name (Active)</label>
                  <input
                    className="form-control"
                    value={form.candidate}
                    onChange={e => setForm({ ...form, candidate: e.target.value })}
                    placeholder="e.g. Sneha Rao"
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                <div className="form-group">
                  <label>Daily Target</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={form.target}
                    onChange={e => setForm({ ...form, target: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Actual</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={form.actual}
                    onChange={e => setForm({ ...form, actual: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Long Apps</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={form.longApps}
                    onChange={e => setForm({ ...form, longApps: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Short Apps</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={form.shortApps}
                    onChange={e => setForm({ ...form, shortApps: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Recruiter</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
