import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'

interface Task { _id: string; title: string; description: string; priority: string; status: string; dueDate: string; createdBy: string; remarks: string }

type Col = 'pending' | 'inprogress' | 'completed' | 'onhold'
const COLS: { id: Col; label: string; color: string }[] = [
  { id: 'pending', label: 'Pending', color: '#eab308' },
  { id: 'inprogress', label: 'In Progress', color: '#1E22D0' },
  { id: 'completed', label: 'Completed', color: '#22c55e' },
  { id: 'onhold', label: 'On Hold', color: '#6b7280' },
]

const P_COLOR: Record<string, string> = { high: '#ef4444', medium: '#eab308', low: '#22c55e' }

export default function DailyTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '', createdBy: 'Shashank', remarks: '' })

  useEffect(() => {
    fetch('/api/tasks').then(r => r.json()).then(d => { if (Array.isArray(d)) setTasks(d) }).catch(() => {})
  }, [])

  const moveTask = (id: string, status: Col) => {
    setTasks(prev => prev.map(t => t._id === id ? { ...t, status } : t))
    fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }).catch(() => {})
  }

  const addTask = () => {
    const newTask: Task = { _id: Date.now().toString(), ...form, status: 'pending' }
    setTasks(prev => [...prev, newTask])
    fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTask) }).catch(() => {})
    setShowModal(false)
    setForm({ title: '', description: '', priority: 'medium', dueDate: '', createdBy: 'Shashank', remarks: '' })
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div><h1>Daily Tasks</h1><p>Manage and track daily operational tasks</p></div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} />Add Task</button>
        </div>
      </div>

      <div className="kanban-board">
        {COLS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id)
          return (
            <div key={col.id} className="kanban-col">
              <div className="kanban-col-header">
                <div className="kanban-col-title" style={{ color: col.color }}>{col.label}</div>
                <div className="kanban-col-count">{colTasks.length}</div>
              </div>
              {colTasks.map((t, i) => (
                <motion.div key={t._id} className="task-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                    <span className="priority-dot" style={{ background: P_COLOR[t.priority], flexShrink: 0 }} />
                    <div className="task-card-title">{t.title}</div>
                  </div>
                  {t.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{t.description}</div>}
                  <div className="task-card-meta">
                    {t.dueDate && <span>📅 {t.dueDate}</span>}
                    <span>👤 {t.createdBy}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
                    {COLS.filter(c => c.id !== col.id).map(c => (
                      <button key={c.id} className="btn btn-outline btn-sm" style={{ fontSize: 10, padding: '3px 7px' }} onClick={() => moveTask(t._id, c.id)}>→ {c.label}</button>
                    ))}
                  </div>
                </motion.div>
              ))}
              {colTasks.length === 0 && <div style={{ color: 'var(--text-dim)', fontSize: 12, textAlign: 'center', paddingTop: 40 }}>No tasks</div>}
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3>Add New Task</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="form-group"><label>Title</label><input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="form-group"><label>Description</label><input className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label>Priority</label>
                <select className="form-control" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select>
              </div>
              <div className="form-group"><label>Due Date</label><input type="date" className="form-control" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>Remarks</label><input className="form-control" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addTask} disabled={!form.title}>Add Task</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
