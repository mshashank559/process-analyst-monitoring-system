import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'

interface Issue { _id: string; title: string; description: string; status: string; priority: string; assignee: string; reporter: string; createdAt?: string }

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'badge-red' },
  under_review: { label: 'Under Review', cls: 'badge-orange' },
  resolved: { label: 'Resolved', cls: 'badge-blue' },
  closed: { label: 'Closed', cls: 'badge-green' },
}
const PRIORITY_MAP: Record<string, string> = { critical: 'badge-red', high: 'badge-orange', medium: 'badge-yellow', low: 'badge-cyan' }

export default function IssueTracker() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignee: '', reporter: 'Shashank' })

  useEffect(() => {
    fetch('/api/issues').then(r => r.json()).then(d => { if (Array.isArray(d)) setIssues(d) }).catch(() => {})
  }, [])

  const filtered = filterStatus ? issues.filter(i => i.status === filterStatus) : issues

  const updateStatus = (id: string, status: string) => {
    setIssues(prev => prev.map(i => i._id === id ? { ...i, status } : i))
    fetch(`/api/issues/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }).catch(() => {})
  }

  const addIssue = () => {
    const newIssue: Issue = { _id: Date.now().toString(), ...form, status: 'open' }
    setIssues(prev => [newIssue, ...prev])
    fetch('/api/issues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newIssue) }).catch(() => {})
    setShowModal(false)
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div><h1>Issue Tracker</h1><p>Monitor and resolve operational issues</p></div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} />New Issue</button>
        </div>
      </div>

      <div className="filter-bar" style={{ marginBottom: 20 }}>
        {Object.entries(STATUS_MAP).map(([k, v]) => (
          <button key={k} className={`btn btn-sm ${filterStatus === k ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterStatus(filterStatus === k ? '' : k)}>
            {v.label}
          </button>
        ))}
        {filterStatus && <button className="btn btn-outline btn-sm" onClick={() => setFilterStatus('')}>Clear</button>}
      </div>

      <div className="issue-grid">
        {filtered.map((issue, i) => {
          const s = STATUS_MAP[issue.status]
          return (
            <motion.div key={issue._id} className="issue-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <div className="issue-card-header">
                <div className="issue-card-title">{issue.title}</div>
                <span className={`badge ${s?.cls}`}>{s?.label}</span>
              </div>
              <div className="issue-card-desc">{issue.description}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                <span className={`badge ${PRIORITY_MAP[issue.priority]}`}>{issue.priority}</span>
              </div>
              <div className="issue-card-footer">
                <span>👤 {issue.assignee}</span>
                <span>Reported by: {issue.reporter}</span>
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 12, flexWrap: 'wrap' }}>
                {Object.keys(STATUS_MAP).filter(k => k !== issue.status).map(k => (
                  <button key={k} className="btn btn-outline btn-sm" style={{ fontSize: 10, padding: '3px 8px' }} onClick={() => updateStatus(issue._id, k)}>→ {STATUS_MAP[k].label}</button>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3>New Issue</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="form-group"><label>Title</label><input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="form-group"><label>Description</label><textarea className="form-control" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label>Priority</label>
                <select className="form-control" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select>
              </div>
              <div className="form-group"><label>Assignee</label><input className="form-control" value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })} /></div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addIssue} disabled={!form.title}>Create Issue</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
