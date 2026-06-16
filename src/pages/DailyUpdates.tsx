import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'

interface UpdateItem {
  _id: string
  author: string
  content: string
  type: 'positive' | 'warning' | 'info'
  date: string
}

const TYPE_CLS: Record<string, string> = { positive: 'badge-green', warning: 'badge-yellow', info: 'badge-blue' }

export default function DailyUpdates() {
  const [updates, setUpdates] = useState<UpdateItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ author: 'Shashank', content: '', type: 'info' as 'positive' | 'warning' | 'info' })

  const fetchUpdates = () => {
    fetch('/api/updates')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setUpdates(d) })
      .catch(() => {})
  }

  useEffect(() => {
    fetchUpdates()
  }, [])

  const addUpdate = () => {
    const newUpdate = { ...form, date: new Date().toISOString() }
    fetch('/api/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUpdate)
    })
      .then(r => r.json())
      .then(() => {
        fetchUpdates()
        setShowModal(false)
        setForm({ author: 'Shashank', content: '', type: 'info' })
      })
      .catch(() => {})
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Daily Updates</h1>
            <p>Team leader updates and operational notes</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Update
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {updates.map((u, i) => (
          <motion.div
            key={u._id}
            className="glass-card"
            style={{ padding: 20 }}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg,var(--primary),var(--navy))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, flexShrink: 0
              }}>
                {u.author ? u.author[0] : 'U'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{u.author}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {new Date(u.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <span className={`badge ${TYPE_CLS[u.type] || 'badge-blue'}`} style={{ marginLeft: 'auto' }}>
                {u.type}
              </span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{u.content}</p>
          </motion.div>
        ))}

        {updates.length === 0 && (
          <div style={{ color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', paddingTop: 60 }}>
            No updates posted yet. Click <b>Add Update</b> to share one.
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
              <h3>Post Daily Update</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="form-group">
              <label>Author / Team Lead</label>
              <input
                className="form-control"
                value={form.author}
                onChange={e => setForm({ ...form, author: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Update Type</label>
              <select
                className="form-control"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as any })}
              >
                <option value="info">Info</option>
                <option value="positive">Positive / Target Achieved</option>
                <option value="warning">Warning / Issue Raised</option>
              </select>
            </div>
            <div className="form-group">
              <label>Content</label>
              <textarea
                className="form-control"
                rows={4}
                value={form.content}
                placeholder="Write update content here..."
                onChange={e => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addUpdate} disabled={!form.content}>Post Update</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
