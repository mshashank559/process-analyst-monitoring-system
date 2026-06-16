import { useState } from 'react'
import { motion } from 'framer-motion'

export default function Settings() {
  const [notifs, setNotifs] = useState(true)
  const [emails, setEmails] = useState(false)
  const [reports, setReports] = useState(true)

  return (
    <div>
      <div className="page-header"><h1>Settings</h1><p>Manage your preferences and account configuration</p></div>
      <div className="settings-grid">
        <motion.div className="glass-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h2>👤 Profile</h2>
          <div className="form-group"><label>Full Name</label><input className="form-control" defaultValue="Shashank" /></div>
          <div className="form-group"><label>Role</label><input className="form-control" defaultValue="Process Analyst" disabled /></div>
          <div className="form-group"><label>Email</label><input className="form-control" defaultValue="shashank@netbounce.com" /></div>
          <div className="form-group"><label>Organization</label><input className="form-control" defaultValue="NetBounce Placement LLC" disabled /></div>
          <button className="btn btn-primary" style={{ marginTop: 8 }}>Save Changes</button>
        </motion.div>

        <motion.div className="glass-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2>🔔 Notifications</h2>
          <div className="settings-row">
            <div><div style={{ fontWeight: 600, fontSize: 13 }}>Push Notifications</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Receive in-app alerts</div></div>
            <div className={`toggle ${notifs ? 'on' : ''}`} onClick={() => setNotifs(!notifs)} />
          </div>
          <div className="settings-row">
            <div><div style={{ fontWeight: 600, fontSize: 13 }}>Email Reports</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Daily summary emails</div></div>
            <div className={`toggle ${emails ? 'on' : ''}`} onClick={() => setEmails(!emails)} />
          </div>
          <div className="settings-row">
            <div><div style={{ fontWeight: 600, fontSize: 13 }}>Report Reminders</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pending report alerts</div></div>
            <div className={`toggle ${reports ? 'on' : ''}`} onClick={() => setReports(!reports)} />
          </div>
        </motion.div>

        <motion.div className="glass-card" style={{ gridColumn: '1 / -1' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2>🎨 Brand Colors</h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[['Primary Blue', '#1E22D0'], ['Deep Navy', '#07004D'], ['Black', '#000000'], ['White', '#FFFFFF']].map(([name, hex]) => (
              <div key={hex} style={{ textAlign: 'center' }}>
                <div style={{ width: 60, height: 60, borderRadius: 12, background: hex, border: '1px solid var(--border)', marginBottom: 6 }} />
                <div style={{ fontSize: 11, fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{hex}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
