import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, ScrollText } from 'lucide-react'

interface Log { _id: string; action: string; user: string; target: string; details: string; createdAt?: string }

const ACTIONS = ['LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'RESOLVE', 'VERIFY', 'REVIEW', 'EXPORT']
const ACTION_CLS: Record<string, string> = {
  LOGIN: 'audit-LOGIN', CREATE: 'audit-CREATE', UPDATE: 'audit-UPDATE',
  DELETE: 'audit-DELETE', RESOLVE: 'audit-RESOLVE', VERIFY: 'audit-CREATE',
  REVIEW: 'audit-UPDATE', EXPORT: 'audit-LOGIN',
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<Log[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ action: 'LOGIN', user: 'Shashank', target: '', details: '' })

  const fetchLogs = () => {
    fetch('/api/audit')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setLogs(d) })
      .catch(() => {})
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const addLog = () => {
    fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
      .then(r => r.json())
      .then(() => {
        fetchLogs()
        setShowModal(false)
        setForm({ action: 'LOGIN', user: 'Shashank', target: '', details: '' })
      })
      .catch(() => {})
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Audit Logs</h1>
            <p>Track all user actions and system events</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Log Action
          </button>
        </div>
      </div>

      <div className="glass-card">
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <ScrollText size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
            <p style={{ fontSize: 14 }}>No audit logs yet.</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Actions will appear here as you use the system.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Action</th><th>User</th><th>Target</th><th>Details</th><th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <motion.tr key={log._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <td>
                      <span className={`audit-action ${ACTION_CLS[log.action] || 'audit-UPDATE'}`}>{log.action}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.user}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{log.target || '—'}</td>
                    <td style={{ fontSize: 12 }}>{log.details}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN') : '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div
            className="modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3>Log Audit Action</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Action Type</label>
                <select className="form-control" value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}>
                  {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>User / Actor</label>
                <input className="form-control" value={form.user} onChange={e => setForm({ ...form, user: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Target (Page / Record / Module)</label>
              <input className="form-control" value={form.target} placeholder="e.g. Recruiter/Ravi Kumar" onChange={e => setForm({ ...form, target: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Details</label>
              <textarea className="form-control" rows={3} value={form.details} placeholder="Describe the action taken…" onChange={e => setForm({ ...form, details: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addLog} disabled={!form.details}>Save Log</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
