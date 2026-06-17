import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, X, Download, Eye } from 'lucide-react'
import * as XLSX from 'xlsx'
import { generateRecruiterLandscapePDF } from '../utils/recruiterPdfExporter'
import type { RecruiterPDFData } from '../utils/recruiterPdfExporter'

interface Recruiter {
  _id: string
  date: string
  srName: string
  recruiterName: string
  candidateName: string
  candidateStatus: string
  longApps: number
  shortApps: number
  totalApps: number
  interviewCount: number
  interviewStatus: string
  interviewDate: string
  gchat: string
  gchatFollowUp: string
  firstCallDone: string
  secondFollowUp: string
  followUpNotes: string
  targetedProfile: string
  remarks: string
  highlightColor?: string
}

const SR_OPTIONS = [
  'Smit H Patel',
  'Hinanshi Sukhadiya',
  'Barot Himanshu',
  'Riyen Sukhadiya',
  'Shekh Mohmadrehan',
  'Vishal Suthar',
  'SR Shilp'
]

const STATUS_OPTIONS = [
  'Active',
  'Hold',
  'Placed',
  'Rejected'
]

export default function RecruiterMonitoring() {
  const [data, setData] = useState<Recruiter[]>([])
  const [search, setSearch] = useState('')
  const [filterSR, setFilterSR] = useState('')
  const [filterRecruiter, setFilterRecruiter] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedRecruiter, setSelectedRecruiter] = useState<Recruiter | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  const recruiterOptions = Array.from(new Set(data.map(r => r.recruiterName).filter(Boolean))).sort()

  const getRowBgColor = (color?: string) => {
    if (!color) return 'transparent';
    switch (color.toLowerCase()) {
      case 'red': return 'rgba(239, 68, 68, 0.15)';
      case 'green': return 'rgba(34, 197, 94, 0.15)';
      case 'yellow': return 'rgba(234, 179, 8, 0.15)';
      case 'blue': return 'rgba(59, 130, 246, 0.15)';
      default: return 'transparent';
    }
  }

  const handleHighlight = (id: string, color: string) => {
    fetch(`/api/recruiters/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ highlightColor: color })
    })
      .then(res => res.json())
      .then(() => {
        fetchRecruiters()
      })
      .catch(err => console.error(err))
  }
  
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    srName: 'SR Shilp',
    recruiterName: '',
    candidateName: '',
    candidateStatus: 'Active',
    longApps: '',
    shortApps: '',
    totalApps: '',
    interviewCount: '',
    interviewStatus: '',
    interviewDate: '',
    gchat: 'Yes',
    gchatFollowUp: '',
    firstCallDone: 'Yes',
    secondFollowUp: 'Call',
    followUpNotes: '',
    targetedProfile: 'Yes',
    remarks: ''
  })

  const fetchRecruiters = () => {
    let url = '/api/recruiters?'
    if (startDate) url += `startDate=${startDate}&`
    if (endDate) url += `endDate=${endDate}&`
    fetch(url)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setData(d) })
      .catch(() => {})
  }

  useEffect(() => {
    fetchRecruiters()
  }, [startDate, endDate])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterSR, filterRecruiter, filterStatus, startDate, endDate])

  const filtered = data.filter(r => {
    const q = search.toLowerCase()
    const matchQ = !q || 
      (r.recruiterName && r.recruiterName.toLowerCase().includes(q)) || 
      (r.candidateName && r.candidateName.toLowerCase().includes(q))
    const matchSR = !filterSR || r.srName === filterSR
    const matchRecruiter = !filterRecruiter || r.recruiterName === filterRecruiter
    const matchS = !filterStatus || r.candidateStatus === filterStatus
    return matchQ && matchSR && matchRecruiter && matchS
  })

  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalPages = Math.ceil(filtered.length / pageSize) || 1

  // Auto-calculate Total Apps in form
  useEffect(() => {
    const long = parseInt(form.longApps) || 0
    const short = parseInt(form.shortApps) || 0
    setForm(prev => ({ ...prev, totalApps: String(long + short) }))
  }, [form.longApps, form.shortApps])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      ...form,
      date: form.date ? new Date(form.date) : new Date(),
      longApps: parseInt(form.longApps) || 0,
      shortApps: parseInt(form.shortApps) || 0,
      totalApps: parseInt(form.totalApps) || 0,
      interviewCount: parseInt(form.interviewCount) || 0,
      interviewDate: form.interviewDate ? new Date(form.interviewDate) : null
    }

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
          date: new Date().toISOString().split('T')[0],
          srName: 'SR Shilp',
          recruiterName: '',
          candidateName: '',
          candidateStatus: 'Active',
          longApps: '',
          shortApps: '',
          totalApps: '',
          interviewCount: '',
          interviewStatus: '',
          interviewDate: '',
          gchat: 'Yes',
          gchatFollowUp: '',
          firstCallDone: 'Yes',
          secondFollowUp: 'Call',
          followUpNotes: '',
          targetedProfile: 'Yes',
          remarks: ''
        })
      })
      .catch(err => console.error(err))
  }

  // Export functions
  const exportToExcel = () => {
    const mappedData = filtered.map(item => ({
      "Date": item.date ? new Date(item.date).toLocaleDateString('en-IN') : '—',
      "SR Name": item.srName || '—',
      "Recruiter Name": item.recruiterName || '—',
      "Candidate Name": item.candidateName || '—',
      "Candidate Status": item.candidateStatus || '—',
      "Long Apps": item.longApps ?? 0,
      "Short Apps": item.shortApps ?? 0,
      "Total Apps": item.totalApps ?? 0,
      "Interview Count": item.interviewCount ?? 0,
      "Interview Status": item.interviewStatus || '—',
      "Interview Date": item.interviewDate ? new Date(item.interviewDate).toLocaleDateString('en-IN') : '—',
      "GCHAT": item.gchat || '—',
      "GCHAT FOLLOW UP": item.gchatFollowUp || '—',
      "1st Call Done (Y/N)": item.firstCallDone || '—',
      "2nd Follow-up (Call/Chat/No)": item.secondFollowUp || '—',
      "Follow-up Notes": item.followUpNotes || '—',
      "Targeted Profile (Y/N)": item.targetedProfile || '—',
      "Remarks": item.remarks || '—',
      "Highlight Color": item.highlightColor || 'None'
    }))
    const ws = XLSX.utils.json_to_sheet(mappedData)
    // Add Auto-Filters to Excel Sheet
    const range = XLSX.utils.decode_range(ws['!ref'] || "A1:S1")
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { c: 0, r: 0 },
        e: { c: range.e.c, r: 0 }
      })
    }
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Recruiters Report")
    XLSX.writeFile(wb, `Recruiter_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportToCSV = () => {
    const headers = [
      "Date", "SR Name", "Recruiter Name", "Candidate Name", "Candidate Status",
      "Long Apps", "Short Apps", "Total Apps", "Interview Count", "Interview Status",
      "Interview Date", "GCHAT", "GCHAT FOLLOW UP", "1st Call Done (Y/N)",
      "2nd Follow-up (Call/Chat/No)", "Follow-up Notes", "Targeted Profile (Y/N)", "Remarks", "Highlight Color"
    ]
    
    const csvRows = [
      headers.join(','),
      ...filtered.map(item => [
        `"${item.date ? new Date(item.date).toLocaleDateString('en-IN') : '—'}"`,
        `"${item.srName || ''}"`,
        `"${item.recruiterName || ''}"`,
        `"${item.candidateName || ''}"`,
        `"${item.candidateStatus || ''}"`,
        item.longApps ?? 0,
        item.shortApps ?? 0,
        item.totalApps ?? 0,
        item.interviewCount ?? 0,
        `"${item.interviewStatus || ''}"`,
        `"${item.interviewDate ? new Date(item.interviewDate).toLocaleDateString('en-IN') : '—'}"`,
        `"${item.gchat || ''}"`,
        `"${item.gchatFollowUp || ''}"`,
        `"${item.firstCallDone || ''}"`,
        `"${item.secondFollowUp || ''}"`,
        `"${(item.followUpNotes || '').replace(/"/g, '""')}"`,
        `"${item.targetedProfile || ''}"`,
        `"${(item.remarks || '').replace(/"/g, '""')}"`,
        `"${item.highlightColor || 'None'}"`
      ].join(','))
    ]
    
    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `Recruiter_Report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = () => {
    const dateRangeStr = startDate && endDate 
      ? `From ${new Date(startDate).toLocaleDateString('en-IN')} To ${new Date(endDate).toLocaleDateString('en-IN')}`
      : `All Records (Generated: ${new Date().toLocaleDateString('en-IN')})`

    const filtersApplied = [
      filterSR ? `SR: ${filterSR}` : '',
      filterRecruiter ? `Recruiter: ${filterRecruiter}` : '',
      filterStatus ? `Status: ${filterStatus}` : '',
    ].filter(Boolean).join(' | ') || 'All Records'

    generateRecruiterLandscapePDF(filtered as RecruiterPDFData[], dateRangeStr, filtersApplied)
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Recruiter Monitoring</h1>
            <p>Track daily recruiter performance and logs matching the operational spreadsheet</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={exportToCSV} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Download size={14} /> CSV
            </button>
            <button className="btn btn-outline" onClick={exportToExcel} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Download size={14} /> Excel
            </button>
            <button className="btn btn-outline" onClick={exportToPDF} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Download size={14} /> PDF
            </button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={15} /> Add Daily Entry
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <div className="header-search" style={{ width: 220 }}>
            <Search size={15} />
            <input placeholder="Search recruiter or candidate…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <select className="filter-input" value={filterSR} onChange={e => setFilterSR(e.target.value)}>
            <option value="">All Team Leads (SR)</option>
            {SR_OPTIONS.map(sr => <option key={sr} value={sr}>{sr}</option>)}
          </select>

          <select className="filter-input" value={filterRecruiter} onChange={e => setFilterRecruiter(e.target.value)}>
            <option value="">All Recruiters</option>
            {recruiterOptions.map(rec => <option key={rec} value={rec}>{rec}</option>)}
          </select>

          <select className="filter-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>From:</label>
            <input type="date" className="filter-input" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '6px 10px' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>To:</label>
            <input type="date" className="filter-input" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '6px 10px' }} />
          </div>

          {(search || filterSR || filterRecruiter || filterStatus || startDate || endDate) && (
            <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setFilterSR(''); setFilterRecruiter(''); setFilterStatus(''); setStartDate(''); setEndDate(''); }}>Clear</button>
          )}
        </div>

        <div className="table-wrap" style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: 2000 }}>
            <thead>
              <tr>
                <th style={{ width: 100 }}>Date</th>
                <th style={{ width: 140 }}>SR Name</th>
                <th style={{ width: 140 }}>Recruiter Name</th>
                <th style={{ width: 140 }}>Candidate Name</th>
                <th style={{ width: 110 }}>Candidate Status</th>
                <th style={{ width: 80, textAlign: 'center' }}>Long Apps</th>
                <th style={{ width: 80, textAlign: 'center' }}>Short Apps</th>
                <th style={{ width: 80, textAlign: 'center' }}>Total Apps</th>
                <th style={{ width: 90, textAlign: 'center' }}>Int. Count</th>
                <th style={{ width: 120 }}>Interview Status</th>
                <th style={{ width: 100 }}>Interview Date</th>
                <th style={{ width: 100 }}>GChat</th>
                <th style={{ width: 120 }}>GChat F/U</th>
                <th style={{ width: 100 }}>1st Call Done</th>
                <th style={{ width: 120 }}>2nd Follow-up</th>
                <th style={{ width: 200 }}>Follow-up Notes</th>
                <th style={{ width: 110 }}>Targeted Profile</th>
                <th style={{ width: 200 }}>Remarks</th>
                <th style={{ width: 150, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((r, i) => {
                return (
                  <motion.tr key={r._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.03, 0.5) }} style={{ backgroundColor: getRowBgColor(r.highlightColor) }}>
                    <td>{r.date ? new Date(r.date).toLocaleDateString('en-IN') : '—'}</td>
                    <td><span className="tag">{r.srName || '—'}</span></td>
                    <td style={{ fontWeight: 600 }}>{r.recruiterName || '—'}</td>
                    <td>{r.candidateName || '—'}</td>
                    <td>
                      <span className={`badge ${
                        r.candidateStatus === 'Placed' ? 'badge-green' : 
                        r.candidateStatus === 'Hold' ? 'badge-yellow' : 
                        r.candidateStatus === 'Rejected' ? 'badge-red' : 'badge-blue'
                      }`}>{r.candidateStatus || 'Active'}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{r.longApps ?? 0}</td>
                    <td style={{ textAlign: 'center' }}>{r.shortApps ?? 0}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{r.totalApps ?? 0}</td>
                    <td style={{ textAlign: 'center' }}>{r.interviewCount ?? 0}</td>
                    <td>{r.interviewStatus || '—'}</td>
                    <td>{r.interviewDate ? new Date(r.interviewDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td>{r.gchat || '—'}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-dim)', maxWidth: 150, wordBreak: 'break-word', whiteSpace: 'normal' }} title={r.gchatFollowUp}>{r.gchatFollowUp || '—'}</td>
                    <td>
                      <span className={`tag ${r.firstCallDone === 'Yes' ? 'tag-green' : 'tag-red'}`}>{r.firstCallDone || 'No'}</span>
                    </td>
                    <td>{r.secondFollowUp || '—'}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-dim)', maxWidth: 200, wordBreak: 'break-word', whiteSpace: 'normal' }} title={r.followUpNotes}>{r.followUpNotes || '—'}</td>
                    <td>
                      <span className={`tag ${r.targetedProfile === 'Yes' ? 'tag-green' : 'tag-red'}`}>{r.targetedProfile || 'No'}</span>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-dim)', maxWidth: 200, wordBreak: 'break-word', whiteSpace: 'normal' }} title={r.remarks}>{r.remarks || '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <button
                          className="icon-btn"
                          onClick={() => {
                            setSelectedRecruiter(r)
                            setViewModalOpen(true)
                          }}
                          title="View Details"
                          style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#60a5fa', display: 'inline-flex', padding: 4 }}
                        >
                          <Eye size={15} />
                        </button>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          {['red', 'green', 'yellow', 'blue'].map(color => (
                            <button
                              key={color}
                              onClick={() => handleHighlight(r._id, color)}
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                background: color === 'red' ? '#ef4444' : color === 'green' ? '#22c55e' : color === 'yellow' ? '#eab308' : '#3b82f6',
                                border: r.highlightColor === color ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                                cursor: 'pointer',
                                padding: 0
                              }}
                              title={`Highlight ${color}`}
                            />
                          ))}
                          {r.highlightColor && (
                            <button
                              onClick={() => handleHighlight(r._id, '')}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.5)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                padding: 2
                              }}
                              title="Clear Highlight"
                            >
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={19} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.01)',
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Showing <span style={{ color: '#fff', fontWeight: 500 }}>{((currentPage - 1) * pageSize) + 1}</span> to <span style={{ color: '#fff', fontWeight: 500 }}>{Math.min(currentPage * pageSize, filtered.length)}</span> of <span style={{ color: '#fff', fontWeight: 500 }}>{filtered.length}</span> entries
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  opacity: currentPage === 1 ? 0.4 : 1,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.1)'
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                Page <span style={{ color: '#fff' }}>{currentPage}</span> of <span style={{ color: '#fff' }}>{totalPages}</span>
              </span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  opacity: currentPage === totalPages ? 0.4 : 1,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.1)'
                }}
              >
                Next
              </button>
            </div>
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
            style={{ maxWidth: 800 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3>Add Daily Spreadsheet Entry</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>SR Name (Team Lead)</label>
                  <select
                    className="form-control"
                    value={form.srName}
                    onChange={e => setForm({ ...form, srName: e.target.value })}
                  >
                    {SR_OPTIONS.map(sr => <option key={sr} value={sr}>{sr}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Recruiter Name</label>
                  <input
                    className="form-control"
                    required
                    value={form.recruiterName}
                    onChange={e => setForm({ ...form, recruiterName: e.target.value })}
                    placeholder="e.g. Meghal Patel"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="form-group">
                  <label>Candidate Name</label>
                  <input
                    className="form-control"
                    required
                    value={form.candidateName}
                    onChange={e => setForm({ ...form, candidateName: e.target.value })}
                    placeholder="e.g. Somil Urmil Shah"
                  />
                </div>
                <div className="form-group">
                  <label>Candidate Status</label>
                  <select
                    className="form-control"
                    value={form.candidateStatus}
                    onChange={e => setForm({ ...form, candidateStatus: e.target.value })}
                  >
                    {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="form-group">
                  <label>Long Apps</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="form-control"
                    value={form.longApps}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '')
                      if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '')
                      setForm({ ...form, longApps: val })
                    }}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Short Apps</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="form-control"
                    value={form.shortApps}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '')
                      if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '')
                      setForm({ ...form, shortApps: val })
                    }}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Total Apps (Auto-Calculated)</label>
                  <input
                    type="text"
                    className="form-control"
                    readOnly
                    value={form.totalApps}
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="form-group">
                  <label>Interview Count</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="form-control"
                    value={form.interviewCount}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '')
                      if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '')
                      setForm({ ...form, interviewCount: val })
                    }}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Interview Status</label>
                  <input
                    className="form-control"
                    value={form.interviewStatus}
                    onChange={e => setForm({ ...form, interviewStatus: e.target.value })}
                    placeholder="e.g. Scheduled"
                  />
                </div>
                <div className="form-group">
                  <label>Interview Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.interviewDate}
                    onChange={e => setForm({ ...form, interviewDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div className="form-group">
                  <label>GChat</label>
                  <input
                    className="form-control"
                    value={form.gchat}
                    onChange={e => setForm({ ...form, gchat: e.target.value })}
                    placeholder="Yes/No or Details"
                  />
                </div>
                <div className="form-group">
                  <label>GChat Follow Up</label>
                  <input
                    className="form-control"
                    value={form.gchatFollowUp}
                    onChange={e => setForm({ ...form, gchatFollowUp: e.target.value })}
                    placeholder="e.g. Yes"
                  />
                </div>
                <div className="form-group">
                  <label>1st Call Done</label>
                  <select
                    className="form-control"
                    value={form.firstCallDone}
                    onChange={e => setForm({ ...form, firstCallDone: e.target.value })}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>2nd Follow-up</label>
                  <select
                    className="form-control"
                    value={form.secondFollowUp}
                    onChange={e => setForm({ ...form, secondFollowUp: e.target.value })}
                  >
                    <option value="Call">Call</option>
                    <option value="Chat">Chat</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 15 }}>
                <div className="form-group">
                  <label>Targeted Profile (Y/N)</label>
                  <select
                    className="form-control"
                    value={form.targetedProfile}
                    onChange={e => setForm({ ...form, targetedProfile: e.target.value })}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Follow-up Notes</label>
                  <input
                    className="form-control"
                    value={form.followUpNotes}
                    onChange={e => setForm({ ...form, followUpNotes: e.target.value })}
                    placeholder="e.g. I spoke with candidate regarding resume update"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label>Remarks</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={form.remarks}
                  onChange={e => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Any extra observations or comments..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Entry</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {viewModalOpen && selectedRecruiter && (
        <div className="modal-overlay" onClick={() => { setViewModalOpen(false); setSelectedRecruiter(null); }}>
          <motion.div
            className="modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 850, padding: '28px', background: 'rgba(20, 20, 35, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye style={{ color: '#60a5fa' }} size={22} />
                <h3 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: 600 }}>Detailed Daily Entry Inspection</h3>
              </div>
              <button className="icon-btn" onClick={() => { setViewModalOpen(false); setSelectedRecruiter(null); }} style={{ color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Row 1: Candidate & Recruiter basic info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#60a5fa', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Candidate Profile</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Name:</span> <span style={{ color: '#fff', fontWeight: 600 }}>{selectedRecruiter.candidateName || '—'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Status:</span> 
                      <span className={`badge ${
                        selectedRecruiter.candidateStatus === 'Placed' ? 'badge-green' : 
                        selectedRecruiter.candidateStatus === 'Hold' ? 'badge-yellow' : 
                        selectedRecruiter.candidateStatus === 'Rejected' ? 'badge-red' : 'badge-blue'
                      }`}>{selectedRecruiter.candidateStatus || 'Active'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Targeted Profile:</span> <span className={`tag ${selectedRecruiter.targetedProfile === 'Yes' ? 'tag-green' : 'tag-red'}`}>{selectedRecruiter.targetedProfile || 'No'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Entry Date:</span> <span style={{ color: 'rgba(255,255,255,0.8)' }}>{selectedRecruiter.date ? new Date(selectedRecruiter.date).toLocaleDateString('en-IN') : '—'}</span></div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#60a5fa', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Operations & Ownership</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Team Lead (SR Name):</span> <span className="tag" style={{ color: '#fff' }}>{selectedRecruiter.srName || '—'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Recruiter Name:</span> <span style={{ color: '#fff', fontWeight: 600 }}>{selectedRecruiter.recruiterName || '—'}</span></div>
                    {selectedRecruiter.highlightColor && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Highlight Color:</span> 
                        <span style={{ 
                          display: 'inline-block', 
                          width: '12px', 
                          height: '12px', 
                          borderRadius: '50%', 
                          backgroundColor: selectedRecruiter.highlightColor === 'red' ? '#ef4444' : selectedRecruiter.highlightColor === 'green' ? '#22c55e' : selectedRecruiter.highlightColor === 'yellow' ? '#eab308' : '#3b82f6' 
                        }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: Applications & Interview details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#60a5fa', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Application Submissions</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Long Apps:</span> <span style={{ color: '#fff', fontWeight: 600 }}>{selectedRecruiter.longApps ?? 0}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Short Apps:</span> <span style={{ color: '#fff', fontWeight: 600 }}>{selectedRecruiter.shortApps ?? 0}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px', marginTop: '4px' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 'bold' }}>Total Apps:</span> <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '15px' }}>{selectedRecruiter.totalApps ?? 0}</span></div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#60a5fa', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Interview Logs</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Interview Count:</span> <span style={{ color: '#fff', fontWeight: 600 }}>{selectedRecruiter.interviewCount ?? 0}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Interview Status:</span> <span style={{ color: '#fff' }}>{selectedRecruiter.interviewStatus || '—'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Interview Date:</span> <span style={{ color: 'rgba(255,255,255,0.8)' }}>{selectedRecruiter.interviewDate ? new Date(selectedRecruiter.interviewDate).toLocaleDateString('en-IN') : '—'}</span></div>
                  </div>
                </div>
              </div>

              {/* Row 3: GChat and Compliance */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#60a5fa', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>GChat & Compliance Touchpoints</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>GChat Connected:</span> <span style={{ color: '#fff' }}>{selectedRecruiter.gchat || '—'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>GChat Follow Up:</span> <span style={{ color: '#fff' }}>{selectedRecruiter.gchatFollowUp || '—'}</span></div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>1st Call Done:</span> <span className={`tag ${selectedRecruiter.firstCallDone === 'Yes' ? 'tag-green' : 'tag-red'}`}>{selectedRecruiter.firstCallDone || 'No'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>2nd Follow-up Mode:</span> <span style={{ color: '#fff' }}>{selectedRecruiter.secondFollowUp || '—'}</span></div>
                  </div>
                </div>
              </div>

              {/* Row 4: Feedbacks and Remarks */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#60a5fa', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Follow-up Feedbacks & Notes</h4>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '13px', lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {selectedRecruiter.followUpNotes || 'No notes entered for this candidate.'}
                  </p>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#60a5fa', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Remarks</h4>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '13px', lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {selectedRecruiter.remarks || 'No remarks entered.'}
                  </p>
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
              <button className="btn btn-outline" onClick={() => { setViewModalOpen(false); setSelectedRecruiter(null); }}>Close Inspection</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
