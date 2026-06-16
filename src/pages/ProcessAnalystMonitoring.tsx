import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FileText, ShieldAlert, Award, ChevronDown, ChevronUp, Download, HelpCircle } from 'lucide-react'
import { generateRecruiterPDF } from '../utils/reportGenerator'

interface MonitoringEntry {
  _id: string
  monitoringDate: string
  recruiterName: string
  teamLead: string
  seniorRecruiter?: string
  candidateName: string
  candidateStatus: string
  longApplications: number
  shortApplications: number
  totalApplications: number
  longTargetStatus: string
  shortTargetStatus: string
  overallStatus: string
  feedbackFormAvailable: boolean
  followUp1Done: boolean
  followUp2Done: boolean
  customerRelationCallDone: boolean
  comments: string
  notes: string
  interviewScheduled: boolean
  interviewCompleted: boolean
  interviewFeedbackReceived: boolean
  interviewOutcome: string
  interviewCount: number
  feedbackStatus: string
  warningStatus: string
  isTargetedProfile: boolean
  profileStatus: string
  createdAt?: string

  // New extended fields
  statusComment?: string
  connectedTwiceToday?: string
  connectionReason?: string
  call1Timestamp?: string
  call2Timestamp?: string
  communicationMode?: string
  communicatedInEnglish?: string
  englishComplianceReason?: string
  interviewStatus?: string
  interviewLegitimacy?: string
  legitimacyComment?: string
  tlVerificationComment?: string
  dailyObservation?: string
  dailyChallenge?: string
  processAnalystRemarks?: string
  
  // Targeted Profile Extended
  targetedLongApps?: number
  targetedShortApps?: number
  targetedInterviewCount?: number
  targetedConnectedTwice?: string
  targetedConnectionReason?: string

  complianceScore?: number
}

interface WeeklySummary {
  recruiterName: string
  teamLead: string
  totalCandidates: number
  totalLongApps: number
  totalShortApps: number
  totalApplications: number
  avgAppsPerDay: number
  targetAchievedDays: number
  belowTargetDays: number
  missingFeedback: number
  followUp1Missed: number
  followUp2Missed: number
  crCallMissed: number
  warningCandidates: number
  achievementPct: number

  // Performance stats
  totalInterviews: number
  activeCandidates: number
  holdCandidates: number
  backoutCandidates: number
  placedCandidates: number
  belowTargetProfiles: number
  missingFollowUpsCount: number
  englishViolations: number
  legitimacyPending: number
  avgComplianceScore: number
}

interface EscalationFlag {
  _id: string
  flagType: string
  severity: string
  recruiterName: string
  candidateName: string
  teamLead: string
  monitoringDate: string
  description: string
  resolved: boolean
  resolvedAt?: string
  resolvedNote?: string
  createdAt: string
}

interface ExecutiveStats {
  totalRecruiters: number
  totalCandidates: number
  overallAchievement: number
  englishCompliance: number
  legitimacyPct: number
  openFlags: number
  atRiskFlags: EscalationFlag[]
}

interface TeamLeadSummary {
  teamLead: string
  totalInterviews: number
  legit: number
  notLegit: number
  pending: number
}

export default function ProcessAnalystMonitoring() {
  const [activeTab, setActiveTab] = useState<'entry' | 'executive' | 'weekly' | 'monthly' | 'timeline' | 'flags' | 'history' | 'master_drilldown'>('master_drilldown')

  // Master Drill-Down State
  const [drilldownData, setDrilldownData] = useState<any[]>([])
  const [loadingDrilldown, setLoadingDrilldown] = useState(false)
  const [expandedSRs, setExpandedSRs] = useState<Record<string, boolean>>({})
  const [expandedRecruiters, setExpandedRecruiters] = useState<Record<string, boolean>>({})
  const [targetedOnly, setTargetedOnly] = useState(false)
  const [drilldownSearch, setDrilldownSearch] = useState('')
  
  // Daily Form State
  const [form, setForm] = useState({
    recruiterName: '',
    teamLead: 'Shilp',
    seniorRecruiter: '',
    candidateName: '',
    candidateStatus: 'Active',
    statusComment: '',
    longApplications: '',
    shortApplications: '',
    connectedTwiceToday: 'yes',
    connectionReason: '',
    call1Timestamp: '',
    call2Timestamp: '',
    communicationMode: 'Call',
    communicatedInEnglish: 'yes',
    englishComplianceReason: '',
    interviewCount: '',
    interviewStatus: '',
    interviewLegitimacy: 'Pending Verification',
    legitimacyComment: '',
    tlVerificationComment: '',
    dailyObservation: '',
    dailyChallenge: '',
    processAnalystRemarks: '',
    isTargetedProfile: false,
    profileStatus: 'Active',
    targetedLongApps: '',
    targetedShortApps: '',
    targetedInterviewCount: '',
    targetedConnectedTwice: 'yes',
    targetedConnectionReason: ''
  })

  // Executive summary state
  const [execStats, setExecStats] = useState<ExecutiveStats>({
    totalRecruiters: 0,
    totalCandidates: 0,
    overallAchievement: 0,
    englishCompliance: 0,
    legitimacyPct: 0,
    openFlags: 0,
    atRiskFlags: []
  })
  const [tlSummary, setTlSummary] = useState<TeamLeadSummary[]>([])

  // Weekly Report state
  const [weeklyRange, setWeeklyRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [weeklyReport, setWeeklyReport] = useState<WeeklySummary[]>([])
  const [isWeeklyReportGenerated, setIsWeeklyReportGenerated] = useState(false)
  const [weeklySnapshots, setWeeklySnapshots] = useState<any[]>([])
  const [selectedWeeklySnapshot, setSelectedWeeklySnapshot] = useState<string>('')

  // Monthly Report state
  const [monthlyRange, setMonthlyRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [monthlyReport, setMonthlyReport] = useState<WeeklySummary[]>([])
  const [isMonthlyReportGenerated, setIsMonthlyReportGenerated] = useState(false)
  const [monthlySnapshots, setMonthlySnapshots] = useState<any[]>([])
  const [selectedMonthlySnapshot, setSelectedMonthlySnapshot] = useState<string>('')

  // Trend analysis state
  const [weeklyTrends, setWeeklyTrends] = useState<any[]>([])
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([])

  // Escalation Flags state
  const [flags, setFlags] = useState<EscalationFlag[]>([])
  const [flagFilters, setFlagFilters] = useState({
    resolved: 'false',
    recruiter: '',
    candidate: ''
  })
  const [resolveNotes, setResolveNotes] = useState<Record<string, string>>({})

  // Timeline State
  const [candidateSearch, setCandidateSearch] = useState('')
  const [candidateTimeline, setCandidateTimeline] = useState<any[]>([])

  // History State
  const [logs, setLogs] = useState<MonitoringEntry[]>([])
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({})
  const [filters, setFilters] = useState({
    recruiter: '',
    candidate: '',
    teamLead: '',
    seniorRecruiter: '',
    status: '',
    interviewLegitimacy: '',
    startDate: '',
    endDate: ''
  })

  // Live total applications calculation
  const longAppVal = parseInt(form.longApplications as any) || 0
  const shortAppVal = parseInt(form.shortApplications as any) || 0
  const calculatedTotal = longAppVal + shortAppVal
  const longTargetStatus = longAppVal >= 60 ? 'achieved' : 'missed'
  const shortTargetStatus = shortAppVal >= 40 ? 'achieved' : 'missed'
  const overallTargetStatus = (longAppVal >= 60 && shortAppVal >= 40) ? 'achieved' : (longAppVal === 0 && shortAppVal === 0) ? 'missed' : 'below_target'

  // Fetch Dashboard Stats
  const fetchExecStats = useCallback(() => {
    fetch('/api/monitoring/executive-summary')
      .then(res => res.json())
      .then(d => { if (d) setExecStats(d) })
      .catch(err => console.error(err))

    fetch('/api/monitoring/team-lead-summary')
      .then(res => res.json())
      .then(d => { if (Array.isArray(d)) setTlSummary(d) })
      .catch(err => console.error(err))
  }, [])

  // Fetch Snapshots list
  const fetchSnapshots = useCallback(() => {
    fetch('/api/monitoring/weekly-snapshots')
      .then(res => res.json())
      .then(d => { if (Array.isArray(d)) setWeeklySnapshots(d) })
      .catch(err => console.error(err))

    fetch('/api/monitoring/monthly-snapshots')
      .then(res => res.json())
      .then(d => { if (Array.isArray(d)) setMonthlySnapshots(d) })
      .catch(err => console.error(err))
  }, [])

  // Fetch Trends
  const fetchTrends = useCallback(() => {
    fetch('/api/monitoring/trend-analysis?period=weekly')
      .then(res => res.json())
      .then(d => { if (Array.isArray(d)) setWeeklyTrends(d) })
      .catch(err => console.error(err))

    fetch('/api/monitoring/trend-analysis?period=monthly')
      .then(res => res.json())
      .then(d => { if (Array.isArray(d)) setMonthlyTrends(d) })
      .catch(err => console.error(err))
  }, [])

  // Fetch Flags
  const fetchFlags = useCallback(() => {
    const query = new URLSearchParams(flagFilters).toString()
    fetch(`/api/monitoring/escalation-flags?${query}`)
      .then(res => res.json())
      .then(d => { if (Array.isArray(d)) setFlags(d) })
      .catch(err => console.error(err))
  }, [flagFilters])

  // Fetch History Logs
  const fetchLogs = useCallback(() => {
    const query = new URLSearchParams(filters).toString()
    fetch(`/api/monitoring?${query}`)
      .then(res => res.json())
      .then(d => { if (Array.isArray(d)) setLogs(d) })
      .catch(err => console.error(err))
  }, [filters])

  const fetchDrilldown = useCallback(() => {
    setLoadingDrilldown(true)
    fetch('/api/monitoring/master-drilldown')
      .then(res => res.json())
      .then(d => {
        if (Array.isArray(d)) setDrilldownData(d)
        setLoadingDrilldown(false)
      })
      .catch(err => {
        console.error(err)
        setLoadingDrilldown(false)
      })
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    if (activeTab === 'executive') {
      fetchExecStats()
    } else if (activeTab === 'flags') {
      fetchFlags()
    } else if (activeTab === 'weekly' || activeTab === 'monthly') {
      fetchSnapshots()
      fetchTrends()
    } else if (activeTab === 'master_drilldown') {
      fetchDrilldown()
    }
  }, [activeTab, fetchExecStats, fetchFlags, fetchSnapshots, fetchTrends, fetchDrilldown])

  const getLiveScore = () => {
    let score = 0
    const longVal = parseInt(form.longApplications as any) || 0
    const shortVal = parseInt(form.shortApplications as any) || 0
    if (longVal >= 60 && shortVal >= 40) {
      score += 30
    } else if (longVal > 0 || shortVal > 0) {
      score += 15
    }
    if (form.connectedTwiceToday === 'yes') score += 25
    if (form.communicatedInEnglish === 'yes') score += 20
    if (form.interviewStatus && form.interviewStatus !== '') score += 15
    if (form.interviewLegitimacy === 'Legit') score += 10
    return score
  }

  // Handle Daily Submission (IMMUTABLE Snapshots)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate Mandatory comment fields
    if (form.candidateStatus !== 'Active' && (!form.statusComment || form.statusComment.trim() === '')) {
      alert('Error: Status comment is mandatory for candidate status changes.')
      return
    }
    if (form.connectedTwiceToday === 'no' && (!form.connectionReason || form.connectionReason.trim() === '')) {
      alert('Error: Connection Reason is mandatory if recruiter did not connect twice today.')
      return
    }
    if (form.communicatedInEnglish === 'no' && (!form.englishComplianceReason || form.englishComplianceReason.trim() === '')) {
      alert('Error: English Compliance Reason is mandatory if recruiter did not communicate in English.')
      return
    }
    if (form.interviewLegitimacy !== 'Pending Verification' && (!form.tlVerificationComment || form.tlVerificationComment.trim() === '')) {
      alert('Error: Team Lead verification comment is mandatory when legitimacy is verified.')
      return
    }

    fetch('/api/monitoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        longApplications: parseInt(form.longApplications as any) || 0,
        shortApplications: parseInt(form.shortApplications as any) || 0,
        interviewCount: parseInt(form.interviewCount as any) || 0,
        targetedLongApps: parseInt(form.targetedLongApps as any) || 0,
        targetedShortApps: parseInt(form.targetedShortApps as any) || 0,
        targetedInterviewCount: parseInt(form.targetedInterviewCount as any) || 0,
        monitoringDate: new Date(),
        // Save overall target status on document
        longTargetStatus,
        shortTargetStatus,
        overallStatus: overallTargetStatus
      })
    })
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to submit monitoring entry.')
        return data
      })
      .then(() => {
        alert('Daily Snapshot recorded successfully! Entries are stored as immutable audit logs.')
        // Reset form
        setForm({
          recruiterName: '',
          teamLead: 'Shilp',
          seniorRecruiter: '',
          candidateName: '',
          candidateStatus: 'Active',
          statusComment: '',
          longApplications: '',
          shortApplications: '',
          connectedTwiceToday: 'yes',
          connectionReason: '',
          call1Timestamp: '',
          call2Timestamp: '',
          communicationMode: 'Call',
          communicatedInEnglish: 'yes',
          englishComplianceReason: '',
          interviewCount: '',
          interviewStatus: '',
          interviewLegitimacy: 'Pending Verification',
          legitimacyComment: '',
          tlVerificationComment: '',
          dailyObservation: '',
          dailyChallenge: '',
          processAnalystRemarks: '',
          isTargetedProfile: false,
          profileStatus: 'Active',
          targetedLongApps: '',
          targetedShortApps: '',
          targetedInterviewCount: '',
          targetedConnectedTwice: 'yes',
          targetedConnectionReason: ''
        })
        fetchLogs()
        fetchDrilldown()
        fetchExecStats()
      })
      .catch(err => alert('Submission failed: ' + err.message))
  }

  // Generate Reports
  const generateWeeklyReport = () => {
    const query = new URLSearchParams(weeklyRange).toString()
    fetch(`/api/monitoring/weekly?${query}`)
      .then(res => res.json())
      .then(d => {
        if (d && Array.isArray(d.summary)) {
          setWeeklyReport(d.summary)
          setIsWeeklyReportGenerated(true)
        }
      })
      .catch(err => console.error(err))
  }

  const generateMonthlyReport = () => {
    const query = new URLSearchParams(monthlyRange).toString()
    fetch(`/api/monitoring/monthly?${query}`)
      .then(res => res.json())
      .then(d => {
        if (d && Array.isArray(d.summary)) {
          setMonthlyReport(d.summary)
          setIsMonthlyReportGenerated(true)
        }
      })
      .catch(err => console.error(err))
  }

  // Freeze Reports (Snapshot)
  const freezeWeekly = () => {
    if (weeklyReport.length === 0) return
    fetch('/api/monitoring/freeze-weekly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: weeklyRange.startDate,
        endDate: weeklyRange.endDate,
        summary: weeklyReport,
        totalEntries: weeklyReport.reduce((s,r) => s + r.totalCandidates, 0)
      })
    })
      .then(res => res.json())
      .then(() => {
        alert('Weekly Snapshot Frozen successfully!')
        fetchSnapshots()
      })
      .catch(err => console.error(err))
  }

  const freezeMonthly = () => {
    if (monthlyReport.length === 0) return
    fetch('/api/monitoring/freeze-monthly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: monthlyRange.startDate,
        endDate: monthlyRange.endDate,
        summary: monthlyReport,
        totalEntries: monthlyReport.reduce((s,r) => s + r.totalCandidates, 0)
      })
    })
      .then(res => res.json())
      .then(() => {
        alert('Monthly Snapshot Frozen successfully!')
        fetchSnapshots()
      })
      .catch(err => console.error(err))
  }

  // Load Frozen Snapshot
  const handleLoadWeeklySnapshot = (id: string) => {
    setSelectedWeeklySnapshot(id)
    if (!id) {
      setWeeklyReport([])
      setIsWeeklyReportGenerated(false)
      return
    }
    const snap = weeklySnapshots.find(s => s._id === id)
    if (snap) {
      setWeeklyReport(snap.summary)
      setWeeklyRange({
        startDate: snap.startDate.split('T')[0],
        endDate: snap.endDate.split('T')[0]
      })
      setIsWeeklyReportGenerated(true)
    }
  }

  const handleLoadMonthlySnapshot = (id: string) => {
    setSelectedMonthlySnapshot(id)
    if (!id) {
      setMonthlyReport([])
      setIsMonthlyReportGenerated(false)
      return
    }
    const snap = monthlySnapshots.find(s => s._id === id)
    if (snap) {
      setMonthlyReport(snap.summary)
      setMonthlyRange({
        startDate: snap.startDate.split('T')[0],
        endDate: snap.endDate.split('T')[0]
      })
      setIsMonthlyReportGenerated(true)
    }
  }

  // Download Recruiter PDF Report
  const handleDownloadPDF = async (rec: WeeklySummary, type: 'Weekly' | 'Monthly') => {
    // 1. Fetch monitoring entries for this recruiter inside selected range
    const range = type === 'Weekly' ? weeklyRange : monthlyRange
    const startStr = range.startDate
    const endStr = range.endDate
    
    try {
      const [resEntries, resAudits] = await Promise.all([
        fetch(`/api/monitoring?recruiter=${encodeURIComponent(rec.recruiterName)}&startDate=${startStr}&endDate=${endStr}`).then(r => r.json()),
        fetch(`/api/status-audit`).then(r => r.json())
      ])

      // Filter audits related to this recruiter's candidate list
      const candNames = new Set(resEntries.map((e: any) => e.candidateName))
      const relatedAudits = resAudits.filter((sa: any) => candNames.has(sa.candidateName))
      
      const dateRangeStr = `${new Date(startStr).toLocaleDateString('en-IN')} to ${new Date(endStr).toLocaleDateString('en-IN')}`
      generateRecruiterPDF(rec, resEntries, relatedAudits, dateRangeStr, type)
    } catch (err) {
      console.error('Failed to generate PDF:', err)
      alert('Failed to generate PDF. Check network logs.')
    }
  }

  // Resolve Escalation Flags
  const handleResolveFlag = (id: string) => {
    const note = resolveNotes[id] || ''
    if (!note.trim()) {
      alert('Please enter a resolution note.')
      return
    }
    fetch(`/api/monitoring/escalation-flags/${id}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolvedNote: note })
    })
      .then(res => res.json())
      .then(() => {
        alert('Escalation resolved successfully!')
        fetchFlags()
        fetchExecStats()
      })
      .catch(err => console.error(err))
  }

  // Search Candidate Timeline
  const handleSearchTimeline = () => {
    if (!candidateSearch.trim()) return
    fetch(`/api/monitoring/candidate-timeline?candidateName=${encodeURIComponent(candidateSearch)}`)
      .then(res => res.json())
      .then(d => {
        if (Array.isArray(d)) setCandidateTimeline(d)
        else setCandidateTimeline([])
      })
      .catch(err => console.error(err))
  }

  // Expand / Collapse history row
  const toggleRow = (id: string) => {
    setExpandedLogs(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Filtering logic for hierarchical drill-down
  const filteredDrilldown = drilldownData.map(sr => {
    const filteredRecs = sr.recruiters.map((rec: any) => {
      const filteredCands = rec.candidates.filter((cand: any) => {
        const matchesTarget = !targetedOnly || cand.isTargeted;
        const matchesSearch = !drilldownSearch ||
          sr.srName.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
          rec.recruiterName.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
          cand.candidateName.toLowerCase().includes(drilldownSearch.toLowerCase());
        return matchesTarget && matchesSearch;
      });

      if (filteredCands.length === 0) return null;

      return {
        ...rec,
        totalCandidates: filteredCands.length,
        candidates: filteredCands
      };
    }).filter(Boolean) as any[];

    if (filteredRecs.length === 0) return null;

    const totalRecs = filteredRecs.length;
    const totalCandidates = filteredRecs.reduce((s, r) => s + r.totalCandidates, 0);

    const statusCounts = { Active: 0, Hold: 0, Backout: 0, Placed: 0 };
    filteredRecs.forEach(r => {
      r.candidates.forEach((c: any) => {
        if (statusCounts[c.status as keyof typeof statusCounts] !== undefined) {
          statusCounts[c.status as keyof typeof statusCounts]++;
        } else {
          statusCounts[c.status as keyof typeof statusCounts] = 1;
        }
      });
    });

    return {
      ...sr,
      totalRecruiters: totalRecs,
      totalCandidates,
      statusCounts,
      recruiters: filteredRecs
    };
  }).filter(Boolean);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Process Analyst Monitoring</h1>
            <p>Perform daily recruiter audits, track KPIs, compliance metrics, and generate frozen snapshots.</p>
          </div>
          <div style={{ display: 'flex', gap: 6, background: 'var(--surface2)', padding: 4, borderRadius: 8, flexWrap: 'wrap' }}>
            <button className={`btn btn-sm ${activeTab === 'master_drilldown' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('master_drilldown')}>Master Drill-Down View</button>
            <button className={`btn btn-sm ${activeTab === 'entry' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('entry')}>Daily Entry Form</button>
            <button className={`btn btn-sm ${activeTab === 'executive' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('executive')}>Executive Summary</button>
            <button className={`btn btn-sm ${activeTab === 'weekly' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('weekly')}>Weekly Report</button>
            <button className={`btn btn-sm ${activeTab === 'monthly' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('monthly')}>Monthly Report</button>
            <button className={`btn btn-sm ${activeTab === 'timeline' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('timeline')}>Candidate Timeline</button>
            <button className={`btn btn-sm ${activeTab === 'flags' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('flags')}>Escalation Flags</button>
            <button className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('history')}>Historical Logs</button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: DAILY ENTRY */}
        {activeTab === 'entry' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card" style={{ padding: 24 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Basic and Hierarchy */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>1. Basic & Hierarchy Info</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div className="form-group">
                    <label>Date (Auto-filled today)</label>
                    <input className="form-control" type="text" disabled value={new Date().toLocaleDateString('en-IN')} />
                  </div>
                  <div className="form-group">
                    <label>Senior Recruiter Name *</label>
                    <input className="form-control" required value={form.seniorRecruiter} onChange={e => setForm({ ...form, seniorRecruiter: e.target.value })} placeholder="e.g. Anand Sharma" />
                  </div>
                  <div className="form-group">
                    <label>Recruiter Name *</label>
                    <input className="form-control" required value={form.recruiterName} onChange={e => setForm({ ...form, recruiterName: e.target.value })} placeholder="e.g. Ravi Kumar" />
                  </div>
                  <div className="form-group">
                    <label>Team Lead</label>
                    <select className="form-control" value={form.teamLead} onChange={e => setForm({ ...form, teamLead: e.target.value })}>
                      <option value="Shilp">Shilp</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Candidate Name *</label>
                    <input className="form-control" required value={form.candidateName} onChange={e => setForm({ ...form, candidateName: e.target.value })} placeholder="e.g. Sneha Rao" />
                  </div>
                </div>
              </div>

              {/* Application Targets */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>2. Application Monitoring</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 12 }}>
                  <div className="form-group">
                    <label>Long Applications Submitted *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="form-control"
                      required
                      value={form.longApplications}
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '')
                        if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '')
                        setForm({ ...form, longApplications: val })
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Short Applications Submitted *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="form-control"
                      required
                      value={form.shortApplications}
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '')
                        if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '')
                        setForm({ ...form, shortApplications: val })
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Total Applications (Auto)</label>
                    <input type="text" className="form-control" disabled value={calculatedTotal} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 8, background: 'var(--surface2)', fontSize: 13 }}>
                  <div>Long Target (60): <span className={`badge ${longTargetStatus === 'achieved' ? 'badge-green' : 'badge-red'}`}>{longTargetStatus.toUpperCase()}</span></div>
                  <div>Short Target (40): <span className={`badge ${shortTargetStatus === 'achieved' ? 'badge-green' : 'badge-red'}`}>{shortTargetStatus.toUpperCase()}</span></div>
                  <div>Overall Status: <span className={`badge ${overallTargetStatus === 'achieved' ? 'badge-green' : 'badge-red'}`}>{overallTargetStatus.replace('_', ' ').toUpperCase()}</span></div>
                </div>
              </div>

              {/* Candidate Status */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>3. Candidate Status</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div className="form-group">
                    <label>Candidate Status *</label>
                    <select className="form-control" value={form.candidateStatus} onChange={e => setForm({ ...form, candidateStatus: e.target.value })}>
                      <option value="Active">Active</option>
                      <option value="Hold">Hold</option>
                      <option value="Backout">Backout</option>
                      <option value="Placed">Placed</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Status Comment (Mandatory) *</label>
                    <textarea className="form-control" required rows={2} value={form.statusComment} onChange={e => setForm({ ...form, statusComment: e.target.value })} placeholder="State specific reason/details for candidate status..." />
                  </div>
                </div>
              </div>

              {/* Follow-Up Compliance */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>4. Recruiter Follow-Up</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div className="form-group">
                    <label>Connected Twice Today? *</label>
                    <select className="form-control" value={form.connectedTwiceToday} onChange={e => setForm({ ...form, connectedTwiceToday: e.target.value })}>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Call 1 Timestamp</label>
                    <input className="form-control" type="datetime-local" value={form.call1Timestamp} onChange={e => setForm({ ...form, call1Timestamp: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Call 2 Timestamp</label>
                    <input className="form-control" type="datetime-local" value={form.call2Timestamp} onChange={e => setForm({ ...form, call2Timestamp: e.target.value })} />
                  </div>
                  {form.connectedTwiceToday === 'no' && (
                    <div className="form-group" style={{ gridColumn: 'span 3' }}>
                      <label>Connection Reason (Mandatory when No) *</label>
                      <input className="form-control" required={form.connectedTwiceToday === 'no'} value={form.connectionReason} onChange={e => setForm({ ...form, connectionReason: e.target.value })} placeholder="e.g. Candidate unavailable / Phone switched off" />
                    </div>
                  )}
                </div>
              </div>

              {/* Communication Mode & Language Compliance */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>5. Communication Mode</h3>
                  <div className="form-group">
                    <label>Communication Mode Monitored</label>
                    <input className="form-control" disabled value="📞 Call (Standard)" />
                  </div>
                </div>
                <div>
                  <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>6. Language Compliance</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="form-group">
                      <label>Communicated in English? *</label>
                      <select className="form-control" value={form.communicatedInEnglish} onChange={e => setForm({ ...form, communicatedInEnglish: e.target.value })}>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    {form.communicatedInEnglish === 'no' && (
                      <div className="form-group">
                        <label>English Violation Reason (Mandatory when No) *</label>
                        <input className="form-control" required={form.communicatedInEnglish === 'no'} value={form.englishComplianceReason} onChange={e => setForm({ ...form, englishComplianceReason: e.target.value })} placeholder="e.g. Candidate insisted on Hindi / Regional language spoken" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Interview Monitoring & Legitimacy */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>7. Interview Monitoring & Legitimacy</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
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
                    />
                  </div>
                  <div className="form-group">
                    <label>Interview Status</label>
                    <select className="form-control" value={form.interviewStatus} onChange={e => setForm({ ...form, interviewStatus: e.target.value })}>
                      <option value="">Select Option</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Feedback Pending">Feedback Pending</option>
                      <option value="Selected">Selected</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Marketing TL Verification Legitimacy *</label>
                    <select className="form-control" value={form.interviewLegitimacy} onChange={e => setForm({ ...form, interviewLegitimacy: e.target.value })}>
                      <option value="Pending Verification">Pending Verification</option>
                      <option value="Legit">Legit</option>
                      <option value="Not Legit">Not Legit</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                  <div className="form-group">
                    <label>Legitimacy Comment (Mandatory) *</label>
                    <textarea className="form-control" required rows={2} value={form.legitimacyComment} onChange={e => setForm({ ...form, legitimacyComment: e.target.value })} placeholder="Analyst audit comments on interview legitimacy verification..." />
                  </div>
                  <div className="form-group">
                    <label>Team Lead Verification Comment {form.interviewLegitimacy !== 'Pending Verification' ? '*' : '(Optional)'}</label>
                    <textarea className="form-control" required={form.interviewLegitimacy !== 'Pending Verification'} rows={2} value={form.tlVerificationComment} onChange={e => setForm({ ...form, tlVerificationComment: e.target.value })} placeholder="TL Comments (Mandatory if Legit / Not Legit)..." />
                  </div>
                </div>
              </div>

              {/* Recruiter Daily Observation Section */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>8. Daily Context & Observations</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                  <div className="form-group">
                    <label>Daily Observation</label>
                    <textarea className="form-control" rows={3} value={form.dailyObservation} onChange={e => setForm({ ...form, dailyObservation: e.target.value })} placeholder="e.g. Candidate unavailable / Interview rescheduled..." />
                  </div>
                  <div className="form-group">
                    <label>Daily Challenge</label>
                    <textarea className="form-control" rows={3} value={form.dailyChallenge} onChange={e => setForm({ ...form, dailyChallenge: e.target.value })} placeholder="e.g. Recruiter on approved leave / Client feedback delayed..." />
                  </div>
                  <div className="form-group">
                    <label>Process Analyst Remarks</label>
                    <textarea className="form-control" rows={3} value={form.processAnalystRemarks} onChange={e => setForm({ ...form, processAnalystRemarks: e.target.value })} placeholder="General comments on today's tracking..." />
                  </div>
                </div>
              </div>

              {/* Targeted Profile Check */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>9. Targeted Profile Monitoring</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.isTargetedProfile} onChange={e => setForm({ ...form, isTargetedProfile: e.target.checked })} />
                    Is this a Targeted Profile? (Expands fields below)
                  </label>

                  {form.isTargetedProfile && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card" style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                      <div className="form-group">
                        <label>Profile Status</label>
                        <select className="form-control" value={form.profileStatus} onChange={e => setForm({ ...form, profileStatus: e.target.value })}>
                          <option value="Active">Active</option>
                          <option value="Hold">Hold</option>
                          <option value="Interview Scheduled">Interview Scheduled</option>
                          <option value="Placed">Placed</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Targeted Long Apps</label>
                        <input
                          className="form-control"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={form.targetedLongApps}
                          onChange={e => {
                            let val = e.target.value.replace(/\D/g, '')
                            if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '')
                            setForm({ ...form, targetedLongApps: val })
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Targeted Short Apps</label>
                        <input
                          className="form-control"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={form.targetedShortApps}
                          onChange={e => {
                            let val = e.target.value.replace(/\D/g, '')
                            if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '')
                            setForm({ ...form, targetedShortApps: val })
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Targeted Total Applications (Auto-calculated)</label>
                        <input className="form-control" type="text" disabled value={(parseInt(form.targetedLongApps as any) || 0) + (parseInt(form.targetedShortApps as any) || 0)} />
                      </div>
                      <div className="form-group">
                        <label>Targeted Interview Count</label>
                        <input
                          className="form-control"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={form.targetedInterviewCount}
                          onChange={e => {
                            let val = e.target.value.replace(/\D/g, '')
                            if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '')
                            setForm({ ...form, targetedInterviewCount: val })
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Targeted Connected Twice?</label>
                        <select className="form-control" value={form.targetedConnectedTwice} onChange={e => setForm({ ...form, targetedConnectedTwice: e.target.value })}>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                      {form.targetedConnectedTwice === 'no' && (
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label>Targeted Connection Reason</label>
                          <input className="form-control" value={form.targetedConnectionReason} onChange={e => setForm({ ...form, targetedConnectionReason: e.target.value })} placeholder="Reason..." />
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Scorecard Preview & Submit */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Award size={20} color="var(--primary)" />
                  <span style={{ fontWeight: 600 }}>Live Compliance Score:</span>
                  <span className={`badge ${(getLiveScore()) >= 80 ? 'badge-green' : (getLiveScore()) >= 60 ? 'badge-yellow' : 'badge-red'}`} style={{ fontSize: 14, padding: '6px 12px' }}>
                    {getLiveScore()}%
                  </span>
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '12px 36px', fontSize: 14 }}>Submit Daily Snapshot</button>
              </div>
            </form>
          </motion.div>
        )}

        {/* TAB 2: EXECUTIVE SUMMARY */}
        {activeTab === 'executive' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* KPI Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              <div className="kpi-card">
                <span className="kpi-label">Monitored Recruiters</span>
                <span className="kpi-val">{execStats.totalRecruiters}</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Monitored Candidates</span>
                <span className="kpi-val">{execStats.totalCandidates}</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Overall Targets Achieved</span>
                <span className="kpi-val">{execStats.overallAchievement}%</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">English Compliance</span>
                <span className="kpi-val">{execStats.englishCompliance}%</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Interview Legitimacy</span>
                <span className="kpi-val">{execStats.legitimacyPct}%</span>
              </div>
              <div className="kpi-card" style={{ borderLeft: '3px solid var(--danger)' }}>
                <span className="kpi-label" style={{ color: 'var(--danger)' }}>Open Red Flags</span>
                <span className="kpi-val" style={{ color: 'var(--danger)' }}>{execStats.openFlags}</span>
              </div>
            </div>

            {/* At Risk Table */}
            <div>
              <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <ShieldAlert size={18} /> Profiles at Risk (Unresolved Red Flags)
              </h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Flag Type</th><th>Severity</th><th>Recruiter</th><th>Candidate</th><th>Team Lead</th><th>Description</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {execStats.atRiskFlags.map(f => (
                      <tr key={f._id}>
                        <td><span className="tag" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{f.flagType.toUpperCase()}</span></td>
                        <td>
                          <span className={`badge ${f.severity === 'critical' ? 'badge-red' : f.severity === 'high' ? 'badge-yellow' : 'badge-blue'}`}>
                            {f.severity.toUpperCase()}
                          </span>
                        </td>
                        <td><b>{f.recruiterName}</b></td>
                        <td>{f.candidateName}</td>
                        <td>{f.teamLead}</td>
                        <td style={{ fontSize: 11 }}>{f.description}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <input className="form-control form-control-sm" placeholder="Resolution note..." style={{ width: 120, height: 26, fontSize: 11 }} value={resolveNotes[f._id] || ''} onChange={e => setResolveNotes({ ...resolveNotes, [f._id]: e.target.value })} />
                            <button className="btn btn-sm btn-primary" style={{ padding: '0 8px', height: 26, fontSize: 11 }} onClick={() => handleResolveFlag(f._id)}>Resolve</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {execStats.atRiskFlags.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--text-dim)' }}>✓ No active at-risk profiles. Great job!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TL Verification Summary */}
            <div>
              <h3 style={{ marginBottom: 12 }}>Marketing Team Lead Verification Summary</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Team Lead</th><th>Total Monitored Interviews</th><th>Verified Legit</th><th>Verified Not Legit</th><th>Pending Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tlSummary.map(tl => (
                      <tr key={tl.teamLead}>
                        <td style={{ fontWeight: 600 }}>{tl.teamLead}</td>
                        <td>{tl.totalInterviews}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>{tl.legit}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{tl.notLegit}</td>
                        <td style={{ color: 'var(--warning)' }}>{tl.pending}</td>
                      </tr>
                    ))}
                    {tlSummary.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: 'var(--text-dim)' }}>No verified interviews recorded.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: WEEKLY REPORT */}
        {activeTab === 'weekly' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <div>
                <h2>Weekly Snapshot & Compliance Summary</h2>
                <p>Generate, freeze, and download PDF reports for weekly monitoring compliance.</p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <select className="form-control" style={{ width: 220 }} value={selectedWeeklySnapshot} onChange={e => handleLoadWeeklySnapshot(e.target.value)}>
                  <option value="">-- View Frozen Snapshot --</option>
                  {weeklySnapshots.map(snap => (
                    <option key={snap._id} value={snap._id}>
                      {new Date(snap.startDate).toLocaleDateString('en-IN')} to {new Date(snap.endDate).toLocaleDateString('en-IN')} (Frozen: {new Date(snap.frozenAt).toLocaleDateString('en-IN')})
                    </option>
                  ))}
                </select>
                <input type="date" className="form-control" style={{ width: 140 }} value={weeklyRange.startDate} onChange={e => setWeeklyRange({ ...weeklyRange, startDate: e.target.value })} />
                <span>to</span>
                <input type="date" className="form-control" style={{ width: 140 }} value={weeklyRange.endDate} onChange={e => setWeeklyRange({ ...weeklyRange, endDate: e.target.value })} />
                <button className="btn btn-primary" onClick={generateWeeklyReport}><FileText size={15} /> Generate</button>
                {isWeeklyReportGenerated && !selectedWeeklySnapshot && (
                  <button className="btn btn-secondary" style={{ background: '#eab308', color: '#000' }} onClick={freezeWeekly}>Freeze Snapshot</button>
                )}
              </div>
            </div>

            {isWeeklyReportGenerated ? (
              <>
                {/* Red Flags Summary */}
                <div>
                  <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><ShieldAlert size={18} /> Red Flags Autodetected</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {weeklyReport.filter(r => r.belowTargetProfiles > 0 || r.missingFollowUpsCount > 0 || r.englishViolations > 0 || r.legitimacyPending > 0).map(r => (
                      <div key={r.recruiterName} className="glass-card" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.01)', padding: 16 }}>
                        <div style={{ fontWeight: 700 }}>{r.recruiterName} ({r.teamLead})</div>
                        <ul style={{ fontSize: 12, paddingLeft: 16, marginTop: 8, color: 'var(--text-muted)' }}>
                          {r.belowTargetProfiles > 0 && <li style={{ color: 'var(--danger)' }}>Applications below target on {r.belowTargetProfiles} entries.</li>}
                          {r.missingFollowUpsCount > 0 && <li style={{ color: 'var(--warning)' }}>Missed twice-daily follow-ups: {r.missingFollowUpsCount}.</li>}
                          {r.englishViolations > 0 && <li style={{ color: 'var(--warning)' }}>English communication violations: {r.englishViolations}.</li>}
                          {r.legitimacyPending > 0 && <li style={{ color: '#0891b2' }}>Legitimacy verification pending: {r.legitimacyPending}.</li>}
                        </ul>
                      </div>
                    ))}
                    {weeklyReport.filter(r => r.belowTargetProfiles > 0 || r.missingFollowUpsCount > 0 || r.englishViolations > 0 || r.legitimacyPending > 0).length === 0 && (
                      <div style={{ color: 'var(--success)' }}>No red flags found for the selected timeframe.</div>
                    )}
                  </div>
                </div>

                {/* Performance Table */}
                <div>
                  <h3>Recruiter Weekly Performance Metrics</h3>
                  <div className="table-wrap" style={{ marginTop: 12 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Recruiter</th><th>Team Lead</th><th>Candidates</th><th>Long Apps</th><th>Short Apps</th><th>Total</th><th>Avg/Day</th><th>Interviews</th><th>Compliance Score</th><th>WoW Trend</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyReport.map(r => {
                          const trendInfo = weeklyTrends.find(t => t.recruiterName === r.recruiterName)
                          return (
                            <tr key={r.recruiterName}>
                              <td style={{ fontWeight: 600 }}>{r.recruiterName}</td>
                              <td><span className="tag">{r.teamLead}</span></td>
                              <td>{r.totalCandidates}</td>
                              <td>{r.totalLongApps}</td>
                              <td>{r.totalShortApps}</td>
                              <td><b>{r.totalApplications}</b></td>
                              <td>{r.avgAppsPerDay}</td>
                              <td>{r.totalInterviews}</td>
                              <td>
                                <span className={`badge ${r.avgComplianceScore >= 80 ? 'badge-green' : r.avgComplianceScore >= 60 ? 'badge-yellow' : 'badge-red'}`}>
                                  {r.avgComplianceScore}%
                                </span>
                              </td>
                              <td>
                                {trendInfo ? (
                                  <span style={{ color: trendInfo.improvement > 0 ? 'var(--success)' : trendInfo.improvement < 0 ? 'var(--danger)' : 'var(--text-dim)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {trendInfo.improvement > 0 ? '▲' : trendInfo.improvement < 0 ? '▼' : '■'} {Math.abs(trendInfo.improvement)}%
                                  </span>
                                ) : '—'}
                              </td>
                              <td>
                                <button className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handleDownloadPDF(r, 'Weekly')}>
                                  <Download size={12} /> Download PDF
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>
                Select a week range and click Generate or load a frozen snapshot.
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 4: MONTHLY REPORT */}
        {activeTab === 'monthly' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <div>
                <h2>Monthly Snapshot & Performance Metrics</h2>
                <p>Generate frozen monthly snapshot aggregates, review compliance percentages, and export recruiter PDFs.</p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <select className="form-control" style={{ width: 220 }} value={selectedMonthlySnapshot} onChange={e => handleLoadMonthlySnapshot(e.target.value)}>
                  <option value="">-- View Frozen Snapshot --</option>
                  {monthlySnapshots.map(snap => (
                    <option key={snap._id} value={snap._id}>
                      {new Date(snap.startDate).toLocaleDateString('en-IN')} to {new Date(snap.endDate).toLocaleDateString('en-IN')} (Frozen: {new Date(snap.frozenAt).toLocaleDateString('en-IN')})
                    </option>
                  ))}
                </select>
                <input type="date" className="form-control" style={{ width: 140 }} value={monthlyRange.startDate} onChange={e => setMonthlyRange({ ...monthlyRange, startDate: e.target.value })} />
                <span>to</span>
                <input type="date" className="form-control" style={{ width: 140 }} value={monthlyRange.endDate} onChange={e => setMonthlyRange({ ...monthlyRange, endDate: e.target.value })} />
                <button className="btn btn-primary" onClick={generateMonthlyReport}><FileText size={15} /> Generate</button>
                {isMonthlyReportGenerated && !selectedMonthlySnapshot && (
                  <button className="btn btn-secondary" style={{ background: '#eab308', color: '#000' }} onClick={freezeMonthly}>Freeze Snapshot</button>
                )}
              </div>
            </div>

            {isMonthlyReportGenerated ? (
              <>
                {/* Red Flags Summary */}
                <div>
                  <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><ShieldAlert size={18} /> Monthly Red Flags</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {monthlyReport.filter(r => r.belowTargetProfiles > 0 || r.missingFollowUpsCount > 0 || r.englishViolations > 0 || r.legitimacyPending > 0).map(r => (
                      <div key={r.recruiterName} className="glass-card" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.01)', padding: 16 }}>
                        <div style={{ fontWeight: 700 }}>{r.recruiterName} ({r.teamLead})</div>
                        <ul style={{ fontSize: 12, paddingLeft: 16, marginTop: 8, color: 'var(--text-muted)' }}>
                          {r.belowTargetProfiles > 0 && <li style={{ color: 'var(--danger)' }}>Below target: {r.belowTargetProfiles} days.</li>}
                          {r.missingFollowUpsCount > 0 && <li style={{ color: 'var(--warning)' }}>Missed follow-ups: {r.missingFollowUpsCount}.</li>}
                          {r.englishViolations > 0 && <li style={{ color: 'var(--warning)' }}>English violations: {r.englishViolations}.</li>}
                          {r.legitimacyPending > 0 && <li style={{ color: '#0891b2' }}>Legitimacy pending: {r.legitimacyPending}.</li>}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recruiter Stats */}
                <div>
                  <h3>Monthly Performance Summary</h3>
                  <div className="table-wrap" style={{ marginTop: 12 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Recruiter</th><th>Team Lead</th><th>Candidates</th><th>Long Apps</th><th>Short Apps</th><th>Total</th><th>Avg/Day</th><th>Interviews</th><th>Compliance Score</th><th>MoM Trend</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyReport.map(r => {
                          const trendInfo = monthlyTrends.find(t => t.recruiterName === r.recruiterName)
                          return (
                            <tr key={r.recruiterName}>
                              <td style={{ fontWeight: 600 }}>{r.recruiterName}</td>
                              <td><span className="tag">{r.teamLead}</span></td>
                              <td>{r.totalCandidates}</td>
                              <td>{r.totalLongApps}</td>
                              <td>{r.totalShortApps}</td>
                              <td><b>{r.totalApplications}</b></td>
                              <td>{r.avgAppsPerDay}</td>
                              <td>{r.totalInterviews}</td>
                              <td>
                                <span className={`badge ${r.avgComplianceScore >= 80 ? 'badge-green' : r.avgComplianceScore >= 60 ? 'badge-yellow' : 'badge-red'}`}>
                                  {r.avgComplianceScore}%
                                </span>
                              </td>
                              <td>
                                {trendInfo ? (
                                  <span style={{ color: trendInfo.improvement > 0 ? 'var(--success)' : trendInfo.improvement < 0 ? 'var(--danger)' : 'var(--text-dim)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {trendInfo.improvement > 0 ? '▲' : trendInfo.improvement < 0 ? '▼' : '■'} {Math.abs(trendInfo.improvement)}%
                                  </span>
                                ) : '—'}
                              </td>
                              <td>
                                <button className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handleDownloadPDF(r, 'Monthly')}>
                                  <Download size={12} /> Download PDF
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>
                Select a month range and click Generate or view past frozen snapshots.
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 5: CANDIDATE TIMELINE */}
        {activeTab === 'timeline' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2>Candidate Activity Timeline Logs</h2>
              <p>Review the historical audit of application updates, status changes, and follow-ups for a candidate.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, maxWidth: 450 }}>
              <div className="header-search" style={{ flex: 1 }}>
                <Search size={14} />
                <input placeholder="Search candidate name..." value={candidateSearch} onChange={e => setCandidateSearch(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={handleSearchTimeline}>View Timeline</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
              {candidateTimeline.map((item, idx) => (
                <div key={idx} className="glass-card" style={{ display: 'flex', gap: 16, borderLeft: `3px solid ${item.type === 'status_change' ? 'var(--primary)' : item.type === 'interview_update' ? 'var(--warning)' : item.type === 'follow_up' ? '#a855f7' : 'var(--success)'}` }}>
                  <div style={{ flexShrink: 0, width: 90, fontSize: 11, color: 'var(--text-dim)', paddingTop: 4 }}>
                    {new Date(item.date).toLocaleDateString('en-IN')}<br/>
                    {new Date(item.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{item.description}</div>
                    
                    {item.details && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, background: 'var(--surface2)', padding: 8, borderRadius: 6, fontSize: 11, marginTop: 8 }}>
                        {item.details.dailyObservation && <div><b>Daily Obs:</b> {item.details.dailyObservation}</div>}
                        {item.details.dailyChallenge && <div><b>Challenge:</b> {item.details.dailyChallenge}</div>}
                        {item.details.remarks && <div><b>Remarks:</b> {item.details.remarks}</div>}
                        <div><b>Legitimacy:</b> {item.details.legitimacy}</div>
                        <div><b>Compliance Score:</b> {item.details.score}%</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {candidateSearch && candidateTimeline.length === 0 && (
                <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 20 }}>No records found for this candidate.</div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 6: ESCALATION FLAGS */}
        {activeTab === 'flags' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2>Compliance Escalation Flags & Alerts</h2>
                <p>A central dashboard to monitor auto-generated red flags. Resolve flags once compliance issues are resolved.</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select className="form-control" style={{ width: 140 }} value={flagFilters.resolved} onChange={e => setFlagFilters({ ...flagFilters, resolved: e.target.value })}>
                  <option value="false">Unresolved</option>
                  <option value="true">Resolved</option>
                </select>
                <input className="form-control" placeholder="Recruiter..." style={{ width: 130 }} value={flagFilters.recruiter} onChange={e => setFlagFilters({ ...flagFilters, recruiter: e.target.value })} />
                <input className="form-control" placeholder="Candidate..." style={{ width: 130 }} value={flagFilters.candidate} onChange={e => setFlagFilters({ ...flagFilters, candidate: e.target.value })} />
                <button className="btn btn-primary" onClick={fetchFlags}>Apply</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginTop: 10 }}>
              {flags.map(f => (
                <div key={f._id} className="glass-card" style={{ borderLeft: `3px solid ${f.severity === 'critical' ? 'var(--danger)' : f.severity === 'high' ? 'var(--warning)' : 'var(--primary)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="tag" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>{f.flagType.replace('_', ' ').toUpperCase()}</span>
                    <span className={`badge ${f.severity === 'critical' ? 'badge-red' : f.severity === 'high' ? 'badge-yellow' : 'badge-blue'}`}>{f.severity.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Candidate: {f.candidateName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
                    Recruiter: {f.recruiterName} | TL: {f.teamLead} | Date: {new Date(f.monitoringDate).toLocaleDateString('en-IN')}
                  </div>
                  <div style={{ fontSize: 12, background: 'var(--surface2)', padding: 8, borderRadius: 6, marginBottom: 12 }}>{f.description}</div>
                  
                  {f.resolved ? (
                    <div style={{ fontSize: 11, borderTop: '1px solid var(--border)', paddingTop: 8, color: 'var(--success)' }}>
                      <b>Resolved:</b> {new Date(f.resolvedAt || '').toLocaleDateString('en-IN')}<br/>
                      <b>Note:</b> {f.resolvedNote}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                      <input className="form-control form-control-sm" placeholder="Resolution note..." value={resolveNotes[f._id] || ''} onChange={e => setResolveNotes({ ...resolveNotes, [f._id]: e.target.value })} />
                      <button className="btn btn-sm btn-primary" onClick={() => handleResolveFlag(f._id)}>Resolve</button>
                    </div>
                  )}
                </div>
              ))}
              {flags.length === 0 && (
                <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 40, width: '100%' }}>No flags match search criteria.</div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 7: HISTORICAL LOGS */}
        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card" style={{ padding: 24 }}>
            {/* Filter Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 12, marginBottom: 20 }}>
              <div className="header-search">
                <Search size={14} />
                <input placeholder="Senior Recruiter..." value={filters.seniorRecruiter} onChange={e => setFilters({ ...filters, seniorRecruiter: e.target.value })} />
              </div>
              <div className="header-search">
                <Search size={14} />
                <input placeholder="Recruiter..." value={filters.recruiter} onChange={e => setFilters({ ...filters, recruiter: e.target.value })} />
              </div>
              <div className="header-search">
                <Search size={14} />
                <input placeholder="Candidate..." value={filters.candidate} onChange={e => setFilters({ ...filters, candidate: e.target.value })} />
              </div>
              <div className="header-search">
                <Search size={14} />
                <input placeholder="Team Lead..." value={filters.teamLead} onChange={e => setFilters({ ...filters, teamLead: e.target.value })} />
              </div>
              <select className="form-control" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                <option value="">-- Candidate Status --</option>
                <option value="Active">Active</option>
                <option value="Hold">Hold</option>
                <option value="Backout">Backout</option>
                <option value="Placed">Placed</option>
              </select>
              <select className="form-control" value={filters.interviewLegitimacy} onChange={e => setFilters({ ...filters, interviewLegitimacy: e.target.value })}>
                <option value="">-- Legitimacy --</option>
                <option value="Pending Verification">Pending</option>
                <option value="Legit">Legit</option>
                <option value="Not Legit">Not Legit</option>
              </select>
              <input type="date" className="form-control" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
              <input type="date" className="form-control" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
              <button className="btn btn-primary" onClick={fetchLogs}>Filter</button>
            </div>

            {/* Read-Only Logs Table */}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <th>Date</th><th>Senior Recruiter</th><th>Recruiter</th><th>Team Lead</th><th>Candidate</th><th>Status</th><th>Long</th><th>Short</th><th>Connect Twice</th><th>English</th><th>Legitimacy</th><th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <>
                      <tr key={log._id} style={{ cursor: 'pointer' }} onClick={() => toggleRow(log._id)}>
                        <td>
                          {expandedLogs[log._id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                        <td style={{ fontSize: 11 }}>{log.monitoringDate ? new Date(log.monitoringDate).toLocaleDateString('en-IN') : '—'}</td>
                        <td>{log.seniorRecruiter || '—'}</td>
                        <td style={{ fontWeight: 600 }}>{log.recruiterName}</td>
                        <td><span className="tag">{log.teamLead}</span></td>
                        <td>{log.candidateName}</td>
                        <td>
                          <span className={`badge ${log.candidateStatus === 'Placed' ? 'badge-green' : log.candidateStatus === 'Backout' ? 'badge-red' : log.candidateStatus === 'Hold' ? 'badge-yellow' : 'badge-blue'}`}>
                            {log.candidateStatus}
                          </span>
                        </td>
                        <td>{log.longApplications}</td>
                        <td>{log.shortApplications}</td>
                        <td>
                          <span className={`badge ${log.connectedTwiceToday === 'yes' ? 'badge-green' : 'badge-red'}`}>
                            {log.connectedTwiceToday === 'yes' ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${log.communicatedInEnglish === 'yes' ? 'badge-green' : 'badge-red'}`}>
                            {log.communicatedInEnglish === 'yes' ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${log.interviewLegitimacy === 'Legit' ? 'badge-green' : log.interviewLegitimacy === 'Not Legit' ? 'badge-red' : 'badge-yellow'}`}>
                            {log.interviewLegitimacy}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${(log.complianceScore || 0) >= 80 ? 'badge-green' : (log.complianceScore || 0) >= 60 ? 'badge-yellow' : 'badge-red'}`}>
                            {log.complianceScore || 0}%
                          </span>
                        </td>
                      </tr>
                      {expandedLogs[log._id] && (
                        <tr>
                          <td colSpan={13} style={{ background: 'var(--surface2)', padding: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                              <div>
                                <h4 style={{ marginBottom: 6, color: 'var(--primary)' }}>Context & Observations</h4>
                                <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <div><b>Daily Observation:</b> {log.dailyObservation || 'None'}</div>
                                  <div><b>Daily Challenge:</b> {log.dailyChallenge || 'None'}</div>
                                  <div><b>PA Remarks:</b> {log.processAnalystRemarks || 'None'}</div>
                                </div>
                              </div>
                              <div>
                                <h4 style={{ marginBottom: 6, color: 'var(--primary)' }}>Comments & Compliance Reason</h4>
                                <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <div><b>Status Comment:</b> {log.statusComment || 'None'}</div>
                                  {log.connectedTwiceToday === 'no' && <div><b>Connection Reason:</b> {log.connectionReason}</div>}
                                  {log.communicatedInEnglish === 'no' && <div><b>English violation Reason:</b> {log.englishComplianceReason}</div>}
                                </div>
                              </div>
                              <div>
                                <h4 style={{ marginBottom: 6, color: 'var(--primary)' }}>Interview & TL Comments</h4>
                                <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <div><b>Interview Count:</b> {log.interviewCount}</div>
                                  <div><b>Interview Status:</b> {log.interviewStatus || 'None'}</div>
                                  <div><b>Legitimacy Comment:</b> {log.legitimacyComment || 'None'}</div>
                                  <div><b>TL Verification Comment:</b> {log.tlVerificationComment || 'None'}</div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={13} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>No monitoring snapshots found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        {/* TAB 8: MASTER DRILL-DOWN VIEW */}
        {activeTab === 'master_drilldown' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Filter controls */}
            <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 280 }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
                  <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    placeholder="Search SR, Recruiter, or Candidate..."
                    className="form-control"
                    style={{ paddingLeft: 38 }}
                    value={drilldownSearch}
                    onChange={e => setDrilldownSearch(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Targeted Candidates Only</span>
                  <div
                    className={`toggle ${targetedOnly ? 'on' : ''}`}
                    onClick={() => setTargetedOnly(!targetedOnly)}
                  />
                </div>
                <button className="btn btn-sm btn-outline" onClick={fetchDrilldown}>Refresh Data</button>
              </div>
            </div>

            {loadingDrilldown ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : filteredDrilldown.length === 0 ? (
              <div className="empty glass-card">
                <HelpCircle size={48} />
                <p style={{ marginTop: 8 }}>No matching candidate hierarchy found.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {filteredDrilldown.map((sr: any) => {
                  const isSRExpanded = !!expandedSRs[sr.srName];
                  return (
                    <div key={sr.srName} className="glass-card fade-up" style={{ padding: 0, overflow: 'hidden', border: isSRExpanded ? '1px solid var(--border-blue)' : '1px solid var(--border)', transition: 'border-color 0.2s' }}>
                      {/* SR Header Card */}
                      <div
                        onClick={() => setExpandedSRs(prev => ({ ...prev, [sr.srName]: !prev[sr.srName] }))}
                        style={{ padding: '16px 20px', background: 'rgba(30, 34, 208, 0.03)', borderBottom: isSRExpanded ? '1px solid var(--border)' : 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {isSRExpanded ? <ChevronUp size={20} style={{ color: 'var(--primary-light)' }} /> : <ChevronDown size={20} style={{ color: 'var(--text-muted)' }} />}
                          <div>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
                              Senior Recruiter: <span style={{ color: 'var(--primary-light)' }}>{sr.srName}</span>
                            </h3>
                          </div>
                        </div>

                        {/* SR KPIs */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            Recruiters: <span style={{ fontWeight: 700, color: 'var(--text)' }}>{sr.totalRecruiters}</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            Candidates: <span style={{ fontWeight: 700, color: 'var(--text)' }}>{sr.totalCandidates}</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            WoW Compl.: <span className="badge badge-blue">{sr.weeklyPerformance}%</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            MoM Compl.: <span className="badge badge-blue">{sr.monthlyPerformance}%</span>
                          </div>
                          {/* Status counts breakdown */}
                          <div style={{ display: 'flex', gap: 6 }}>
                            <span className="badge badge-green" title="Active Candidates">{sr.statusCounts.Active || 0} A</span>
                            <span className="badge badge-yellow" title="Hold Candidates">{sr.statusCounts.Hold || 0} H</span>
                            <span className="badge badge-red" title="Backout Candidates">{sr.statusCounts.Backout || 0} B</span>
                            <span className="badge badge-cyan" title="Placed Candidates">{sr.statusCounts.Placed || 0} P</span>
                          </div>
                        </div>
                      </div>

                      {/* SR Child Section (Recruiters) */}
                      {isSRExpanded && (
                        <div style={{ padding: '16px 20px', background: 'rgba(255, 255, 255, 0.01)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {sr.recruiters.map((rec: any) => {
                            const isRecExpanded = !!expandedRecruiters[rec.recruiterName];
                            const statusColor = rec.status === 'achieved' ? 'var(--green)' : rec.status === 'below_target' ? 'var(--yellow)' : 'var(--red)';
                            
                            return (
                              <div key={rec.recruiterName} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                                {/* Recruiter Header bar */}
                                <div
                                  onClick={() => setExpandedRecruiters(prev => ({ ...prev, [rec.recruiterName]: !prev[rec.recruiterName] }))}
                                  style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', borderBottom: isRecExpanded ? '1px solid var(--border)' : 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {isRecExpanded ? <ChevronUp size={16} style={{ color: statusColor }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                                    <span style={{ fontWeight: 700, fontSize: 14 }}>Recruiter: {rec.recruiterName}</span>
                                    <span style={{ fontSize: 10, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4, background: rec.status === 'achieved' ? 'rgba(34,197,94,0.1)' : rec.status === 'below_target' ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)', color: statusColor, fontWeight: 700, border: `1px solid ${statusColor}40` }}>
                                      {rec.status === 'achieved' ? 'Achieved' : rec.status === 'below_target' ? 'Below Target' : 'Missed Target'}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Candidates: <b style={{ color: 'var(--text)' }}>{rec.totalCandidates}</b></span>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Weekly: <span className="badge badge-blue" style={{ fontSize: 10 }}>{rec.weeklyPerformance}%</span></span>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Monthly: <span className="badge badge-blue" style={{ fontSize: 10 }}>{rec.monthlyPerformance}%</span></span>
                                  </div>
                                </div>

                                {/* Recruiter Child Section (Candidates) */}
                                {isRecExpanded && (
                                  <div style={{ padding: 16, background: 'var(--bg)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                                    {rec.candidates.map((cand: any) => {
                                      const complianceColor = cand.monthlyPerformance >= 80 ? 'var(--green)' : cand.monthlyPerformance >= 60 ? 'var(--yellow)' : 'var(--red)';
                                      
                                      return (
                                        <div key={cand.candidateId} className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, border: '1px solid var(--border)', position: 'relative' }}>
                                          
                                          {/* Candidate header */}
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <h4 style={{ margin: 0, fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{cand.candidateName}</h4>
                                                {cand.isTargeted && (
                                                  <span className="badge" style={{ background: 'rgba(249,115,22,0.15)', color: 'var(--orange)', border: '1px solid rgba(249,115,22,0.3)', fontSize: 9 }}>
                                                    Targeted
                                                  </span>
                                                )}
                                              </div>
                                              <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>ID: {cand.candidateId}</span>
                                            </div>
                                            <span className={`badge ${cand.status === 'Active' ? 'badge-green' : cand.status === 'Hold' ? 'badge-yellow' : cand.status === 'Backout' ? 'badge-red' : 'badge-cyan'}`}>
                                              {cand.status}
                                            </span>
                                          </div>

                                          {/* Application Stats funnel */}
                                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, background: 'var(--surface)', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                                            <div>
                                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Short Apps</div>
                                              <div style={{ fontSize: 14, fontWeight: 700 }}>{cand.shortApps} <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>/40</span></div>
                                            </div>
                                            <div>
                                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Long Apps</div>
                                              <div style={{ fontSize: 14, fontWeight: 700 }}>{cand.longApps} <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>/60</span></div>
                                            </div>
                                            <div>
                                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Total Apps</div>
                                              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary-light)' }}>{cand.totalApps}</div>
                                            </div>
                                          </div>

                                          {/* Interview section */}
                                          <div style={{ fontSize: 11, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                              <span style={{ color: 'var(--text-muted)' }}>Interview Scheduled:</span>
                                              <span style={{ fontWeight: 600 }}>{cand.interviewScheduled ? 'Yes' : 'No'}</span>
                                            </div>
                                            {cand.interviewStatus && (
                                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Interview Status:</span>
                                                <span style={{ fontWeight: 600, color: 'var(--cyan)' }}>{cand.interviewStatus}</span>
                                              </div>
                                            )}
                                            {cand.interviewOutcome && (
                                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Outcome:</span>
                                                <span style={{ fontWeight: 600 }}>{cand.interviewOutcome}</span>
                                              </div>
                                            )}
                                            {cand.interviewFeedback && (
                                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Feedback:</span>
                                                <span style={{ fontWeight: 600 }}>{cand.interviewFeedback}</span>
                                              </div>
                                            )}
                                            {cand.interviewComments && (
                                              <div style={{ marginTop: 4, background: 'var(--surface2)', padding: '6px 8px', borderRadius: 4, fontStyle: 'italic', fontSize: 10, color: 'var(--text-muted)' }}>
                                                &ldquo;{cand.interviewComments}&rdquo;
                                              </div>
                                            )}
                                          </div>

                                          {/* TL Verification validation */}
                                          <div style={{ fontSize: 11, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                              <span style={{ color: 'var(--text-muted)' }}>TL Verification:</span>
                                              <span className={`badge ${cand.tlLegitimacy === 'Legit' ? 'badge-green' : cand.tlLegitimacy === 'Not Legit' ? 'badge-red' : 'badge-yellow'}`} style={{ fontSize: 10 }}>
                                                {cand.tlLegitimacy}
                                              </span>
                                            </div>
                                            {cand.tlVerificationComment && (
                                              <div style={{ marginTop: 4, background: 'var(--surface2)', padding: '6px 8px', borderRadius: 4, fontSize: 10 }}>
                                                <b>TL Comment:</b> {cand.tlVerificationComment}
                                              </div>
                                            )}
                                          </div>

                                          {/* Comments & Activity logs */}
                                          <div style={{ fontSize: 11, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                                            {cand.latestActivity && (
                                              <div style={{ marginBottom: 4 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Latest Activity:</span>
                                                <div style={{ marginTop: 2, paddingLeft: 6, borderLeft: '2px solid var(--primary-light)', color: 'var(--text)' }}>
                                                  {cand.latestActivity}
                                                </div>
                                              </div>
                                            )}
                                            {cand.remarks && (
                                              <div>
                                                <span style={{ color: 'var(--text-muted)' }}>Process Analyst Remarks:</span>
                                                <div style={{ marginTop: 2, color: 'var(--text-muted)', fontSize: 10 }}>
                                                  {cand.remarks}
                                                </div>
                                              </div>
                                            )}
                                            {cand.placementNotes && (
                                              <div style={{ marginTop: 4 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Placement Notes:</span>
                                                <div style={{ marginTop: 2, color: 'var(--text-muted)', fontSize: 10 }}>
                                                  {cand.placementNotes}
                                                </div>
                                              </div>
                                            )}
                                          </div>

                                          {/* Compliance scores */}
                                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 10, fontSize: 11 }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Compliance Scores:</span>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                              <span title="Weekly compliance score" style={{ fontWeight: 600, color: 'var(--text)' }}>WoW: <span style={{ color: 'var(--primary-light)' }}>{cand.weeklyPerformance}%</span></span>
                                              <span title="Monthly compliance score" style={{ fontWeight: 600, color: 'var(--text)' }}>MoM: <span style={{ color: complianceColor }}>{cand.monthlyPerformance}%</span></span>
                                            </div>
                                          </div>

                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
