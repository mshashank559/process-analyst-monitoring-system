import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, FileText, Loader2, CheckCircle } from 'lucide-react'
import { fetchReportData, generatePDF } from '../utils/reportGenerator'

const STATUS_CLS: Record<string, string> = {
  pending: 'badge-yellow', submitted: 'badge-blue', reviewed: 'badge-green', approved: 'badge-cyan'
}

export default function DailyReporting() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [reports, setReports] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/reports').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setReports(d)
    }).catch(() => {})
  }, [])

  const handleDownload = async () => {
    setLoading(true)
    setDone(false)
    try {
      const data = await fetchReportData()
      const filename = generatePDF(data)
      console.log('Downloaded:', filename)
      setDone(true)
      setTimeout(() => setDone(false), 4000)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Daily Reporting</h1>
            <p>Monitor report submission status and download manager reports</p>
          </div>

          {/* Download Button */}
          <motion.button
            className="btn btn-primary"
            style={{ gap: 8, padding: '10px 22px', fontSize: 14 }}
            onClick={handleDownload}
            disabled={loading}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? (
              <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />Generating PDF…</>
            ) : done ? (
              <><CheckCircle size={16} />Downloaded!</>
            ) : (
              <><Download size={16} />Download Manager Report</>
            )}
          </motion.button>
        </div>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(30,34,208,0.12), rgba(7,0,77,0.2))',
          border: '1px solid rgba(30,34,208,0.35)',
          borderRadius: 12,
          padding: '14px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg,#1E22D0,#07004D)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <FileText size={18} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>📋 Friday Manager Report</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Click <b>Download Manager Report</b> to generate a professional PDF with Recruiter Performance, Candidate Monitoring, Task Summary, and Issue Tracker — ready to share with your manager.
          </div>
        </div>
      </motion.div>

      {/* Report Status Table */}
      <div className="glass-card">
        <h2>📄 Report Submissions</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Report Title</th>
                <th>Type</th>
                <th>Recruiter</th>
                <th>Team Lead</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r: any, i: number) => (
                <motion.tr
                  key={r.id || r._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <td style={{ fontWeight: 600 }}>{r.title}</td>
                  <td><span className="tag">{r.type}</span></td>
                  <td>{r.recruiter}</td>
                  <td>{r.teamLead}</td>
                  <td><span className={`badge ${STATUS_CLS[r.status]}`}>{r.status}</span></td>
                </motion.tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No reports yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
