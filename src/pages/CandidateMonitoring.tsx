import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LayoutGrid, List, Plus, X } from 'lucide-react'

interface Candidate {
  _id: string; name: string; recruiter: string; interviewCount: number;
  feedbackStatus: string; warningStatus: boolean; warningNote?: string;
  linkedIn?: string;
}

const FEEDBACK_CLS: Record<string, string> = {
  Positive: 'badge-green', Excellent: 'badge-green', Average: 'badge-yellow',
  Pending: 'badge-orange', Negative: 'badge-red', 'Not Started': 'badge-red',
}

export default function CandidateMonitoring() {
  const [data, setData] = useState<Candidate[]>([])
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '', recruiter: '', interviewCount: '',
    feedbackStatus: 'Not Started', warningStatus: false, warningNote: '',
    linkedIn: ''
  })

  const fetchCandidates = () => {
    fetch('/api/candidates')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setData(d) })
      .catch(() => {})
  }

  useEffect(() => {
    fetchCandidates()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetch('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        interviewCount: parseInt(form.interviewCount as any) || 0
      })
    })
      .then(r => r.json())
      .then(() => {
        fetchCandidates()
        setShowModal(false)
        setForm({
          name: '', recruiter: '', interviewCount: '',
          feedbackStatus: 'Not Started', warningStatus: false, warningNote: '',
          linkedIn: ''
        })
      })
      .catch(err => console.error(err))
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Candidate Monitoring</h1>
            <p>Track interview counts, feedback and warning flags</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <Plus size={14} /> Add Candidate
            </button>
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', padding: 3, borderRadius: 8 }}>
              <button className={`btn btn-outline btn-sm ${view === 'cards' ? 'btn-primary' : ''}`} style={{ padding: '6px 12px' }} onClick={() => setView('cards')}><LayoutGrid size={14} /></button>
              <button className={`btn btn-outline btn-sm ${view === 'table' ? 'btn-primary' : ''}`} style={{ padding: '6px 12px' }} onClick={() => setView('table')}><List size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {data.length === 0 && (
        <div className="glass-card empty" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p>No candidates monitored yet. Click <b>Add Candidate</b> to track one.</p>
        </div>
      )}

      {data.length > 0 && (
        view === 'cards' ? (
          <div className="candidate-grid">
            {data.map((c, i) => (
              <motion.div key={c._id} className="candidate-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ scale: 1.02 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="candidate-avatar">{c.name[0]}</div>
                  {c.linkedIn && (
                    <a href={c.linkedIn} target="_blank" rel="noopener noreferrer" className="tag" style={{ color: 'var(--primary-light)' }}>
                      LinkedIn ↗
                    </a>
                  )}
                </div>
                <div className="candidate-name">{c.name}</div>
                <div className="candidate-recruiter">Recruiter: {c.recruiter}</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div className="interview-count">{c.interviewCount}</div>
                    <div className="interview-label">Interviews</div>
                  </div>
                  <span className={`badge ${FEEDBACK_CLS[c.feedbackStatus] || 'badge-blue'}`}>{c.feedbackStatus}</span>
                </div>
                {c.warningStatus && (
                  <div className="warning-badge">⚠ {c.warningNote || 'Warning'}</div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Candidate</th><th>Recruiter</th><th>Interviews</th><th>Feedback</th><th>Warning</th></tr>
                </thead>
                <tbody>
                  {data.map((c, i) => (
                    <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>{c.recruiter}</td>
                      <td><b style={{ color: 'var(--primary-light)', fontSize: 18 }}>{c.interviewCount}</b></td>
                      <td><span className={`badge ${FEEDBACK_CLS[c.feedbackStatus] || 'badge-blue'}`}>{c.feedbackStatus}</span></td>
                      <td>{c.warningStatus ? <span className="badge badge-red">⚠ {c.warningNote}</span> : <span className="badge badge-green">Clear</span>}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div
            className="modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 480 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3>Add New Candidate</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Candidate Name</label>
                <input
                  className="form-control"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sneha Rao"
                />
              </div>
              <div className="form-group">
                <label>Recruiter Name</label>
                <input
                  className="form-control"
                  required
                  value={form.recruiter}
                  onChange={e => setForm({ ...form, recruiter: e.target.value })}
                  placeholder="e.g. Ravi Kumar"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Interviews Count</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="form-control"
                    required
                    value={form.interviewCount}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '')
                      if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '')
                      setForm({ ...form, interviewCount: val })
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Feedback Status</label>
                  <select
                    className="form-control"
                    value={form.feedbackStatus}
                    onChange={e => setForm({ ...form, feedbackStatus: e.target.value })}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="Pending">Pending</option>
                    <option value="Average">Average</option>
                    <option value="Positive">Positive</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Negative">Negative</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>LinkedIn Profile URL</label>
                <input
                  className="form-control"
                  value={form.linkedIn}
                  onChange={e => setForm({ ...form, linkedIn: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
                <input
                  type="checkbox"
                  id="warningStatus"
                  checked={form.warningStatus}
                  onChange={e => setForm({ ...form, warningStatus: e.target.checked })}
                  style={{ width: 16, height: 16 }}
                />
                <label htmlFor="warningStatus" style={{ margin: 0, cursor: 'pointer' }}>Raise Performance Warning Flag</label>
              </div>
              {form.warningStatus && (
                <div className="form-group">
                  <label>Warning Note / Reason</label>
                  <input
                    className="form-control"
                    required={form.warningStatus}
                    value={form.warningNote}
                    onChange={e => setForm({ ...form, warningNote: e.target.value })}
                    placeholder="e.g. Missing interviews / inactive on channels"
                  />
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Candidate</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
