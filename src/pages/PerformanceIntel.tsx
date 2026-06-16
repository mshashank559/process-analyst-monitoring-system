import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Target, TrendingUp, ShieldCheck, RefreshCw, Edit2, X, CheckCircle, AlertTriangle } from 'lucide-react'

interface Recruiter {
  _id: string; name: string; teamLead: string; target: number; actual: number
  monthlyTarget: number; gchatConnected: boolean; gchatName: string; status: string
}
interface Candidate {
  _id: string; name: string; recruiter: string; interviewCount: number
  interviewRound: string; feedbackStatus: string; monthlyTarget: number; monthlyApps: number
  gchatConnected: boolean; gchatName: string; warningStatus: boolean
  mtTlVerified: boolean; mtTlVerifiedBy: string; mtTlVerifiedNote: string
}

const ROUND_ORDER = ['Not Started', 'Round 1', 'Round 2', 'Round 3', 'HR Round', 'Final Round', 'Offer']
const ROUND_COLOR: Record<string, string> = {
  'Not Started': '#6b7280', 'Round 1': '#06b6d4', 'Round 2': '#1E22D0',
  'Round 3': '#8b5cf6', 'HR Round': '#f97316', 'Final Round': '#22c55e', 'Offer': '#eab308',
}

function targetColor(pct: number) {
  if (pct >= 100) return '#22c55e'
  if (pct >= 70)  return '#eab308'
  if (pct >= 60)  return '#f97316'
  return '#ef4444'
}

function pct(actual: number, target: number) {
  if (!target) return 0
  return Math.round((actual / target) * 100)
}

export default function PerformanceIntel() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [editRec, setEditRec] = useState<Recruiter | null>(null)
  const [editCand, setEditCand] = useState<Candidate | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/recruiters').then(r => r.json()).catch(() => []),
      fetch('/api/candidates').then(r => r.json()).catch(() => []),
    ]).then(([r, c]) => {
      setRecruiters(Array.isArray(r) ? r : [])
      setCandidates(Array.isArray(c) ? c : [])
      setLoading(false)
    })
  }, [])

  useEffect(() => { load() }, [load])

  const patchRec = (id: string, patch: Partial<Recruiter>) => {
    setRecruiters(prev => prev.map(r => r._id === id ? { ...r, ...patch } : r))
    fetch(`/api/recruiters/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).catch(() => {})
  }
  const patchCand = (id: string, patch: Partial<Candidate>) => {
    setCandidates(prev => prev.map(c => c._id === id ? { ...c, ...patch } : c))
    fetch(`/api/candidates/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).catch(() => {})
  }

  const gchatConnected = recruiters.filter(r => r.gchatConnected)
  const gchatNotConnected = recruiters.filter(r => !r.gchatConnected)
  const mtVerified = candidates.filter(c => c.mtTlVerified)
  const mtPending = candidates.filter(c => !c.mtTlVerified)

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Performance Intel</h1>
            <p>Target tracking, GChat connections, interview rounds & MT/TL verification</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={load} style={{ gap: 6 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <>
          {/* ── Section 1: Recruiter Target Tracker ─────────────────── */}
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#1E22D0,#07004D)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={16} color="white" />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Recruiter Target Achievement</h2>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px' }}>
                ⚠️ 60–70% = Warning zone
              </span>
            </div>

            {recruiters.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                No recruiter data yet — add recruiters in Recruiter Monitoring.
              </div>
            ) : (
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Recruiter</th><th>Team Lead</th><th>Daily Target</th><th>Actual</th>
                        <th>Achievement %</th><th>Progress</th><th>GChat</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recruiters.map((r, i) => {
                        const p = pct(r.actual, r.target)
                        const color = targetColor(p)
                        return (
                          <motion.tr key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                            <td style={{ fontWeight: 700 }}>{r.name}</td>
                            <td><span className="tag">{r.teamLead}</span></td>
                            <td><b>{r.target}</b></td>
                            <td style={{ color, fontWeight: 700 }}>{r.actual}</td>
                            <td>
                              <span style={{
                                background: `${color}18`, color, border: `1px solid ${color}40`,
                                borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700
                              }}>
                                {p}%
                              </span>
                            </td>
                            <td style={{ minWidth: 120 }}>
                              <div style={{ background: 'var(--surface2)', borderRadius: 4, height: 7, overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(p, 100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s' }} />
                              </div>
                            </td>
                            <td>
                              {r.gchatConnected
                                ? <span className="badge badge-green" style={{ cursor: 'pointer' }} onClick={() => patchRec(r._id, { gchatConnected: false })}>✓ {r.gchatName || 'Connected'}</span>
                                : <span className="badge badge-red" style={{ cursor: 'pointer' }} onClick={() => setEditRec(r)}>✕ Not Connected</span>
                              }
                            </td>
                            <td>
                              <button className="btn btn-outline btn-sm" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setEditRec(r)}>
                                <Edit2 size={11} /> Edit
                              </button>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* ── Section 2: GChat Connection Status ───────────────────── */}
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#06b6d4,#07004D)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={16} color="white" />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>GChat Connections</h2>
              <span className="badge badge-green">{gchatConnected.length} Connected</span>
              <span className="badge badge-red">{gchatNotConnected.length} Not Connected</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {recruiters.map((r, i) => (
                <motion.div key={r._id} className="glass-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: r.gchatConnected ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)', border: `1px solid ${r.gchatConnected ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={17} color={r.gchatConnected ? '#22c55e' : '#ef4444'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.gchatConnected ? (r.gchatName || 'Connected') : 'Not on GChat yet'}
                    </div>
                  </div>
                  <button className="btn btn-outline btn-sm" style={{ padding: '3px 8px', fontSize: 10, flexShrink: 0 }}
                    onClick={() => r.gchatConnected ? patchRec(r._id, { gchatConnected: false }) : setEditRec(r)}>
                    {r.gchatConnected ? 'Remove' : 'Add'}
                  </button>
                </motion.div>
              ))}
              {recruiters.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No recruiter data yet.</div>}
            </div>
          </section>

          {/* ── Section 3: Candidate Interview Rounds & Monthly Targets ── */}
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#8b5cf6,#1E22D0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={16} color="white" />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Candidate: Month Target & Interview Round</h2>
            </div>
            {candidates.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                No candidate data yet — add candidates in Candidate Monitoring.
              </div>
            ) : (
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Candidate</th><th>Recruiter</th><th>Month Target</th><th>Apps Done</th>
                        <th>Month %</th><th>Interview Round</th><th>Interviews</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidates.map((c, i) => {
                        const p = pct(c.monthlyApps, c.monthlyTarget)
                        const color = targetColor(p)
                        const round = c.interviewRound || 'Not Started'
                        const roundColor = ROUND_COLOR[round] || '#6b7280'
                        return (
                          <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                            <td style={{ fontWeight: 700 }}>{c.name}</td>
                            <td><span className="tag">{c.recruiter}</span></td>
                            <td><b>{c.monthlyTarget || '—'}</b></td>
                            <td style={{ color: c.monthlyTarget ? color : 'var(--text-muted)', fontWeight: 600 }}>{c.monthlyApps ?? '—'}</td>
                            <td>
                              {c.monthlyTarget ? (
                                <span style={{ background: `${color}18`, color, border: `1px solid ${color}40`, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
                                  {p}%
                                </span>
                              ) : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                            </td>
                            <td>
                              <span style={{ background: `${roundColor}18`, color: roundColor, border: `1px solid ${roundColor}40`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                                {round}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700, color: '#1E22D0' }}>{c.interviewCount ?? 0}</td>
                            <td>
                              <button className="btn btn-outline btn-sm" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setEditCand(c)}>
                                <Edit2 size={11} /> Edit
                              </button>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* ── Section 4: MT/TL Legitimacy Verification ─────────────── */}
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#22c55e,#07004D)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={16} color="white" />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>MT/TL Legitimacy Verification</h2>
              <span className="badge badge-green"><CheckCircle size={10} /> {mtVerified.length} Verified</span>
              <span className="badge badge-yellow"><AlertTriangle size={10} /> {mtPending.length} Pending</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {candidates.map((c, i) => (
                <motion.div key={c._id} className="glass-card" style={{ padding: 18, borderLeft: `3px solid ${c.mtTlVerified ? '#22c55e' : '#f97316'}` }}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>via {c.recruiter}</div>
                    </div>
                    {c.mtTlVerified
                      ? <span className="badge badge-green"><CheckCircle size={10} /> Verified</span>
                      : <span className="badge badge-orange"><AlertTriangle size={10} /> Pending</span>
                    }
                  </div>
                  {c.mtTlVerified && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                      ✓ Verified by <b>{c.mtTlVerifiedBy || '—'}</b>
                      {c.mtTlVerifiedNote && <div style={{ marginTop: 3, fontStyle: 'italic' }}>"{c.mtTlVerifiedNote}"</div>}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!c.mtTlVerified ? (
                      <button className="btn btn-primary btn-sm" onClick={() => setEditCand(c)}>
                        <ShieldCheck size={11} /> Mark Verified
                      </button>
                    ) : (
                      <button className="btn btn-outline btn-sm" onClick={() => patchCand(c._id, { mtTlVerified: false, mtTlVerifiedBy: '', mtTlVerifiedNote: '' })}>
                        Revoke
                      </button>
                    )}
                    <button className="btn btn-outline btn-sm" onClick={() => setEditCand(c)}>
                      <Edit2 size={11} /> Edit
                    </button>
                  </div>
                </motion.div>
              ))}
              {candidates.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No candidate data yet.</div>}
            </div>
          </section>
        </>
      )}

      {/* ── Edit Recruiter Modal ────────────────────────────────────── */}
      {editRec && (
        <div className="modal-overlay" onClick={() => setEditRec(null)}>
          <motion.div className="modal" style={{ maxWidth: 440 }} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0 }}>Edit Recruiter — {editRec.name}</h3>
              <button className="icon-btn" onClick={() => setEditRec(null)}><X size={15} /></button>
            </div>
            <div className="form-group">
              <label>GChat Connected</label>
              <select className="form-control" value={editRec.gchatConnected ? 'yes' : 'no'}
                onChange={e => setEditRec({ ...editRec, gchatConnected: e.target.value === 'yes' })}>
                <option value="yes">Yes — Connected</option>
                <option value="no">No — Not Connected</option>
              </select>
            </div>
            <div className="form-group">
              <label>GChat Name</label>
              <input className="form-control" value={editRec.gchatName || ''} placeholder="Name as shown in Google Chat"
                onChange={e => setEditRec({ ...editRec, gchatName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Monthly Target</label>
              <input
                className="form-control"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={editRec.monthlyTarget === 0 ? '' : (editRec.monthlyTarget || '')}
                onChange={e => {
                  let val = e.target.value.replace(/\D/g, '')
                  if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '')
                  setEditRec({ ...editRec, monthlyTarget: val === '' ? 0 : parseInt(val, 10) })
                }}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setEditRec(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                patchRec(editRec._id, { gchatConnected: editRec.gchatConnected, gchatName: editRec.gchatName, monthlyTarget: editRec.monthlyTarget })
                setEditRec(null)
              }}>Save Changes</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Edit Candidate Modal ────────────────────────────────────── */}
      {editCand && (
        <div className="modal-overlay" onClick={() => setEditCand(null)}>
          <motion.div className="modal" style={{ maxWidth: 480 }} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0 }}>Edit Candidate — {editCand.name}</h3>
              <button className="icon-btn" onClick={() => setEditCand(null)}><X size={15} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Monthly Target (Profiles)</label>
                <input
                  className="form-control"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={editCand.monthlyTarget === 0 ? '' : (editCand.monthlyTarget || '')}
                  onChange={e => {
                    let val = e.target.value.replace(/\D/g, '')
                    if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '')
                    setEditCand({ ...editCand, monthlyTarget: val === '' ? 0 : parseInt(val, 10) })
                  }}
                />
              </div>
              <div className="form-group">
                <label>Apps Submitted This Month</label>
                <input
                  className="form-control"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={editCand.monthlyApps === 0 ? '' : (editCand.monthlyApps || '')}
                  onChange={e => {
                    let val = e.target.value.replace(/\D/g, '')
                    if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '')
                    setEditCand({ ...editCand, monthlyApps: val === '' ? 0 : parseInt(val, 10) })
                  }}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Current Interview Round</label>
              <select className="form-control" value={editCand.interviewRound || 'Not Started'}
                onChange={e => setEditCand({ ...editCand, interviewRound: e.target.value })}>
                {ROUND_ORDER.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>GChat Connected</label>
                <select className="form-control" value={editCand.gchatConnected ? 'yes' : 'no'}
                  onChange={e => setEditCand({ ...editCand, gchatConnected: e.target.value === 'yes' })}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="form-group">
                <label>GChat Name</label>
                <input className="form-control" value={editCand.gchatName || ''} placeholder="Google Chat name"
                  onChange={e => setEditCand({ ...editCand, gchatName: e.target.value })} />
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>MT / TL Verification</div>
              <div className="form-group">
                <label>Verification Status</label>
                <select className="form-control" value={editCand.mtTlVerified ? 'verified' : 'pending'}
                  onChange={e => setEditCand({ ...editCand, mtTlVerified: e.target.value === 'verified' })}>
                  <option value="pending">Pending Verification</option>
                  <option value="verified">Verified ✓</option>
                </select>
              </div>
              {editCand.mtTlVerified && (
                <>
                  <div className="form-group">
                    <label>Verified By</label>
                    <input className="form-control" value={editCand.mtTlVerifiedBy || ''} placeholder="Your name / TL name"
                      onChange={e => setEditCand({ ...editCand, mtTlVerifiedBy: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Verification Note</label>
                    <input className="form-control" value={editCand.mtTlVerifiedNote || ''} placeholder="Brief note (optional)"
                      onChange={e => setEditCand({ ...editCand, mtTlVerifiedNote: e.target.value })} />
                  </div>
                </>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setEditCand(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                patchCand(editCand._id, {
                  monthlyTarget: editCand.monthlyTarget, monthlyApps: editCand.monthlyApps,
                  interviewRound: editCand.interviewRound,
                  gchatConnected: editCand.gchatConnected, gchatName: editCand.gchatName,
                  mtTlVerified: editCand.mtTlVerified, mtTlVerifiedBy: editCand.mtTlVerifiedBy,
                  mtTlVerifiedNote: editCand.mtTlVerifiedNote,
                })
                setEditCand(null)
              }}>Save Changes</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
