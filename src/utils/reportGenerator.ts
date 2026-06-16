import jsPDF from 'jspdf'

interface ReportData {
  recruiters: any[]
  candidates: any[]
  tasks: any[]
  issues: any[]
  reports: any[]
  date: string
  period: string
}

export async function fetchReportData(): Promise<ReportData> {
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const [rRes, cRes, tRes, iRes, repRes] = await Promise.all([
    fetch('/api/recruiters').then(r => r.json()).catch(() => []),
    fetch('/api/candidates').then(r => r.json()).catch(() => []),
    fetch('/api/tasks').then(r => r.json()).catch(() => []),
    fetch('/api/issues').then(r => r.json()).catch(() => []),
    fetch('/api/reports').then(r => r.json()).catch(() => []),
  ])

  return {
    recruiters: Array.isArray(rRes) ? rRes : [],
    candidates: Array.isArray(cRes) ? cRes : [],
    tasks: Array.isArray(tRes) ? tRes : [],
    issues: Array.isArray(iRes) ? iRes : [],
    reports: Array.isArray(repRes) ? repRes : [],
    date: dateStr,
    period: `Week of ${today.toLocaleDateString('en-IN')}`,
  }
}

export function generatePDF(data: ReportData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  let y = 0

  const PRIMARY = [30, 34, 208] as [number, number, number]
  const NAVY   = [7, 0, 77]    as [number, number, number]
  const WHITE  = [255, 255, 255] as [number, number, number]
  const LIGHT  = [245, 246, 255] as [number, number, number]
  const GRAY   = [100, 100, 120] as [number, number, number]
  const BLACK  = [20, 20, 40]   as [number, number, number]
  const GREEN  = [34, 197, 94]  as [number, number, number]
  const RED    = [239, 68, 68]  as [number, number, number]
  const YELLOW = [234, 179, 8]  as [number, number, number]

  // ── Header Banner ──────────────────────────────────────────────────
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, 42, 'F')

  doc.setFillColor(...PRIMARY)
  doc.rect(0, 38, W, 4, 'F')

  // NB monogram
  doc.setFillColor(...PRIMARY)
  doc.roundedRect(10, 8, 22, 22, 3, 3, 'F')
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('NB', 21, 23, { align: 'center' })

  // Title
  doc.setTextColor(...WHITE)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('NETBOUNCE PLACEMENT LLC', 38, 17)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 185, 255)
  doc.text('Marketing Command Center — Manager Report', 38, 25)

  // Date badge
  doc.setFillColor(30, 34, 208)
  doc.roundedRect(W - 70, 10, 60, 12, 2, 2, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(data.date, W - 40, 17.5, { align: 'center' })

  y = 50

  // ── Summary KPI Row ─────────────────────────────────────────────────
  const tasks = data.tasks
  const completed = tasks.filter((t: any) => t.status === 'completed').length
  const openIssues = data.issues.filter((i: any) => i.status === 'open' || i.status === 'under_review').length
  const warnings   = data.candidates.filter((c: any) => c.warningStatus).length
  const pendingRep  = data.reports.filter((r: any) => r.status === 'pending').length

  const kpis = [
    { label: 'Recruiters', value: String(data.recruiters.length), color: PRIMARY },
    { label: 'Candidates', value: String(data.candidates.length), color: [8, 182, 212] as [number,number,number] },
    { label: 'Tasks Done', value: `${completed}/${tasks.length}`, color: GREEN },
    { label: 'Open Issues', value: String(openIssues), color: openIssues > 0 ? RED : GREEN },
    { label: 'Warnings', value: String(warnings), color: warnings > 0 ? YELLOW : GREEN },
    { label: 'Reports Due', value: String(pendingRep), color: pendingRep > 0 ? YELLOW : GREEN },
  ]

  const boxW = (W - 20) / kpis.length
  kpis.forEach((kpi, i) => {
    const x = 10 + i * boxW
    doc.setFillColor(...LIGHT)
    doc.roundedRect(x, y, boxW - 2, 22, 2, 2, 'F')
    doc.setDrawColor(...kpi.color)
    doc.setLineWidth(0.8)
    doc.roundedRect(x, y, boxW - 2, 22, 2, 2, 'S')
    doc.setTextColor(...kpi.color)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(kpi.value, x + (boxW - 2) / 2, y + 12, { align: 'center' })
    doc.setTextColor(...GRAY)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(kpi.label, x + (boxW - 2) / 2, y + 19, { align: 'center' })
  })
  y += 30

  // ── Helper: section header ─────────────────────────────────────────
  const sectionHeader = (title: string, icon: string) => {
    doc.setFillColor(...PRIMARY)
    doc.rect(10, y, W - 20, 8, 'F')
    doc.setTextColor(...WHITE)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`${icon}  ${title}`, 14, y + 5.5)
    y += 12
  }

  const tableHeader = (cols: { label: string; w: number }[]) => {
    doc.setFillColor(230, 232, 255)
    doc.rect(10, y, W - 20, 7, 'F')
    doc.setTextColor(...NAVY)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    let cx = 12
    cols.forEach(c => { doc.text(c.label, cx, y + 4.8); cx += c.w })
    y += 7
    doc.setLineWidth(0.2)
    doc.setDrawColor(200, 200, 220)
  }

  const tableRow = (cols: { text: string; w: number; color?: [number,number,number] }[], shade: boolean) => {
    if (y > 265) { doc.addPage(); y = 20 }
    if (shade) { doc.setFillColor(248, 249, 255); doc.rect(10, y, W - 20, 6.5, 'F') }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    let cx = 12
    cols.forEach(c => {
      doc.setTextColor(...(c.color || BLACK))
      doc.text(String(c.text || '—').substring(0, 35), cx, y + 4.5)
      cx += c.w
    })
    doc.setDrawColor(220, 220, 235)
    doc.setLineWidth(0.1)
    doc.line(10, y + 6.5, W - 10, y + 6.5)
    y += 6.5
  }

  // ── 1. Recruiter Performance ───────────────────────────────────────
  sectionHeader('RECRUITER PERFORMANCE', '📊')

  if (data.recruiters.length === 0) {
    doc.setTextColor(...GRAY); doc.setFontSize(8); doc.text('No recruiters recorded this period.', 14, y + 4); y += 10
  } else {
    tableHeader([
      { label: 'Recruiter', w: 40 }, { label: 'Team Lead', w: 38 },
      { label: 'Candidate', w: 38 }, { label: 'Target', w: 18 },
      { label: 'Actual', w: 18 }, { label: 'Status', w: 30 },
    ])
    const statusColor: Record<string, [number,number,number]> = {
      achieved: GREEN, below_target: YELLOW, missed: RED,
    }
    const statusLabel: Record<string, string> = {
      achieved: 'Target Achieved', below_target: 'Below Target', missed: 'Target Missed',
    }
    data.recruiters.forEach((r: any, i: number) => {
      tableRow([
        { text: r.name, w: 40 },
        { text: r.teamLead, w: 38 },
        { text: r.candidate, w: 38 },
        { text: String(r.target), w: 18 },
        { text: String(r.actual), w: 18, color: r.actual >= r.target ? GREEN : r.actual >= r.target * 0.6 ? YELLOW : RED },
        { text: statusLabel[r.status] || r.status, w: 30, color: statusColor[r.status] || BLACK },
      ], i % 2 === 0)
    })
  }
  y += 6

  // ── 2. Candidate Status ────────────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20 }
  sectionHeader('CANDIDATE MONITORING', '👤')

  if (data.candidates.length === 0) {
    doc.setTextColor(...GRAY); doc.setFontSize(8); doc.text('No candidates recorded this period.', 14, y + 4); y += 10
  } else {
    tableHeader([
      { label: 'Candidate', w: 50 }, { label: 'Recruiter', w: 45 },
      { label: 'Interviews', w: 25 }, { label: 'Feedback', w: 40 }, { label: 'Warning', w: 30 },
    ])
    data.candidates.forEach((c: any, i: number) => {
      tableRow([
        { text: c.name, w: 50 },
        { text: c.recruiter, w: 45 },
        { text: String(c.interviewCount), w: 25, color: PRIMARY },
        { text: c.feedbackStatus, w: 40 },
        { text: c.warningStatus ? `⚠ ${c.warningNote || 'Warning'}` : 'Clear', w: 30, color: c.warningStatus ? RED : GREEN },
      ], i % 2 === 0)
    })
  }
  y += 6

  // ── 3. Task Summary ────────────────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20 }
  sectionHeader('TASK SUMMARY', '✅')

  if (tasks.length === 0) {
    doc.setTextColor(...GRAY); doc.setFontSize(8); doc.text('No tasks recorded this period.', 14, y + 4); y += 10
  } else {
    tableHeader([
      { label: 'Task', w: 70 }, { label: 'Priority', w: 25 },
      { label: 'Status', w: 30 }, { label: 'Due Date', w: 30 }, { label: 'Created By', w: 35 },
    ])
    const taskStatusColor: Record<string, [number,number,number]> = {
      completed: GREEN, inprogress: PRIMARY, pending: YELLOW, onhold: GRAY,
    }
    const taskStatusLabel: Record<string, string> = {
      completed: 'Completed', inprogress: 'In Progress', pending: 'Pending', onhold: 'On Hold',
    }
    tasks.forEach((t: any, i: number) => {
      tableRow([
        { text: t.title, w: 70 },
        { text: t.priority?.toUpperCase() || '—', w: 25, color: t.priority === 'high' ? RED : t.priority === 'medium' ? YELLOW : GREEN },
        { text: taskStatusLabel[t.status] || t.status, w: 30, color: taskStatusColor[t.status] || BLACK },
        { text: t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN') : '—', w: 30 },
        { text: t.createdBy, w: 35 },
      ], i % 2 === 0)
    })
  }
  y += 6

  // ── 4. Issue Tracker ────────────────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20 }
  sectionHeader('ISSUE TRACKER', '🚨')

  if (data.issues.length === 0) {
    doc.setTextColor(...GRAY); doc.setFontSize(8); doc.text('No issues recorded this period.', 14, y + 4); y += 10
  } else {
    tableHeader([
      { label: 'Issue', w: 70 }, { label: 'Priority', w: 25 },
      { label: 'Status', w: 35 }, { label: 'Assignee', w: 35 }, { label: 'Reporter', w: 25 },
    ])
    const issueStatusColor: Record<string, [number,number,number]> = {
      open: RED, under_review: YELLOW, resolved: PRIMARY, closed: GREEN,
    }
    const issueStatusLabel: Record<string, string> = {
      open: 'Open', under_review: 'Under Review', resolved: 'Resolved', closed: 'Closed',
    }
    data.issues.forEach((issue: any, i: number) => {
      tableRow([
        { text: issue.title, w: 70 },
        { text: issue.priority?.toUpperCase() || '—', w: 25, color: issue.priority === 'critical' || issue.priority === 'high' ? RED : YELLOW },
        { text: issueStatusLabel[issue.status] || issue.status, w: 35, color: issueStatusColor[issue.status] || BLACK },
        { text: issue.assignee, w: 35 },
        { text: issue.reporter, w: 25 },
      ], i % 2 === 0)
    })
  }
  y += 6

  // ── 5. Recruiter Target Achievement (60–70% Warning Zone) ──────────
  if (y > 220) { doc.addPage(); y = 20 }
  sectionHeader('RECRUITER TARGET ACHIEVEMENT — 60–70% WARNING ZONE', '🎯')

  if (data.recruiters.length === 0) {
    doc.setTextColor(...GRAY); doc.setFontSize(8); doc.text('No recruiter data this period.', 14, y + 4); y += 10
  } else {
    tableHeader([
      { label: 'Recruiter', w: 48 }, { label: 'Team Lead', w: 40 },
      { label: 'Daily Target', w: 28 }, { label: 'Actual', w: 22 },
      { label: 'Achievement %', w: 32 }, { label: 'Zone', w: 20 },
    ])
    data.recruiters.forEach((r: any, i: number) => {
      const p = r.target ? Math.round((r.actual / r.target) * 100) : 0
      const zoneColor: [number,number,number] =
        p >= 100 ? GREEN : p >= 70 ? YELLOW : p >= 60 ? [249,115,22] : RED
      const zone = p >= 100 ? 'On Target' : p >= 70 ? 'Warning ⚠' : p >= 60 ? 'Critical !' : 'Missed ✗'
      tableRow([
        { text: r.name, w: 48 },
        { text: r.teamLead, w: 40 },
        { text: String(r.target || 0), w: 28 },
        { text: String(r.actual || 0), w: 22, color: zoneColor },
        { text: `${p}%`, w: 32, color: zoneColor },
        { text: zone, w: 20, color: zoneColor },
      ], i % 2 === 0)
    })
  }
  y += 6

  // ── 6. GChat Connection Status ────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20 }
  sectionHeader('GCHAT CONNECTION STATUS', '💬')

  const gchatYes = data.recruiters.filter((r: any) => r.gchatConnected)
  const gchatNo  = data.recruiters.filter((r: any) => !r.gchatConnected)

  if (data.recruiters.length === 0) {
    doc.setTextColor(...GRAY); doc.setFontSize(8); doc.text('No recruiter data this period.', 14, y + 4); y += 10
  } else {
    // Summary line
    doc.setFontSize(8); doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GREEN)
    doc.text(`✓ Connected: ${gchatYes.length}  |  `, 12, y + 4)
    doc.setTextColor(...RED)
    doc.text(`✗ Not Connected: ${gchatNo.length}`, 60, y + 4)
    y += 10

    tableHeader([
      { label: 'Recruiter', w: 55 }, { label: 'Team Lead', w: 45 },
      { label: 'GChat Name', w: 55 }, { label: 'Status', w: 35 },
    ])
    data.recruiters.forEach((r: any, i: number) => {
      tableRow([
        { text: r.name, w: 55 },
        { text: r.teamLead, w: 45 },
        { text: r.gchatName || (r.gchatConnected ? r.name : '—'), w: 55 },
        { text: r.gchatConnected ? '✓ Connected' : '✗ Not Connected', w: 35, color: r.gchatConnected ? GREEN : RED },
      ], i % 2 === 0)
    })
  }
  y += 6

  // ── 7. MT/TL Legitimacy Verification ─────────────────────────────
  if (y > 220) { doc.addPage(); y = 20 }
  sectionHeader('MT/TL LEGITIMACY VERIFICATION STATUS', '🛡️')

  if (data.candidates.length === 0) {
    doc.setTextColor(...GRAY); doc.setFontSize(8); doc.text('No candidate data this period.', 14, y + 4); y += 10
  } else {
    const verified = data.candidates.filter((c: any) => c.mtTlVerified)
    const pending  = data.candidates.filter((c: any) => !c.mtTlVerified)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GREEN)
    doc.text(`✓ Verified: ${verified.length}  |  `, 12, y + 4)
    doc.setTextColor(249, 115, 22)
    doc.text(`⏳ Pending: ${pending.length}`, 55, y + 4)
    y += 10

    tableHeader([
      { label: 'Candidate', w: 50 }, { label: 'Recruiter', w: 40 },
      { label: 'Verification', w: 30 }, { label: 'Verified By', w: 35 }, { label: 'Note', w: 35 },
    ])
    data.candidates.forEach((c: any, i: number) => {
      tableRow([
        { text: c.name, w: 50 },
        { text: c.recruiter, w: 40 },
        { text: c.mtTlVerified ? '✓ Verified' : '⏳ Pending', w: 30, color: c.mtTlVerified ? GREEN : [249,115,22] as [number,number,number] },
        { text: c.mtTlVerifiedBy || '—', w: 35 },
        { text: c.mtTlVerifiedNote || '—', w: 35 },
      ], i % 2 === 0)
    })
  }
  y += 6

  // ── Footer ─────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setFillColor(...NAVY)
    doc.rect(0, 285, W, 12, 'F')
    doc.setTextColor(180, 185, 255)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('NetBounce Placement LLC — Confidential Manager Report', 10, 292)
    doc.text(`Page ${p} of ${pageCount}  |  Generated: ${new Date().toLocaleString('en-IN')}`, W - 10, 292, { align: 'right' })
  }

  const filename = `NetBounce_Manager_Report_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
  return filename
}

export function generateRecruiterPDF(
  recSummary: any,
  entries: any[],
  statusAudits: any[],
  dateRange: string,
  reportType: 'Weekly' | 'Monthly'
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  let y = 0

  const PRIMARY = [30, 34, 208] as [number, number, number]
  const NAVY   = [7, 0, 77]    as [number, number, number]
  const WHITE  = [255, 255, 255] as [number, number, number]
  const LIGHT  = [245, 246, 255] as [number, number, number]
  const GRAY   = [100, 100, 120] as [number, number, number]
  const BLACK  = [20, 20, 40]   as [number, number, number]
  const GREEN  = [34, 197, 94]  as [number, number, number]
  const RED    = [239, 68, 68]  as [number, number, number]
  const YELLOW = [234, 179, 8]  as [number, number, number]

  // ── Header Banner ──────────────────────────────────────────────────
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, 42, 'F')

  doc.setFillColor(...PRIMARY)
  doc.rect(0, 38, W, 4, 'F')

  // NB monogram
  doc.setFillColor(...PRIMARY)
  doc.roundedRect(10, 8, 22, 22, 3, 3, 'F')
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('NB', 21, 23, { align: 'center' })

  // Title
  doc.setTextColor(...WHITE)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('NETBOUNCE PLACEMENT LLC', 38, 17)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 185, 255)
  doc.text(`Process Monitoring - Recruiter ${reportType} Report`, 38, 25)

  // Date range badge
  doc.setFillColor(30, 34, 208)
  doc.roundedRect(W - 75, 10, 65, 12, 2, 2, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(dateRange, W - 42.5, 17.5, { align: 'center' })

  y = 50

  // ── Recruiter & Team Lead Info ──
  doc.setTextColor(...BLACK)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`Recruiter: ${recSummary.recruiterName || 'Unknown'}`, 10, y)
  doc.text(`Team Lead: ${recSummary.teamLead || 'Unknown'}`, 100, y)
  y += 10

  // ── Summary KPI Row ─────────────────────────────────────────────────
  const kpis = [
    { label: 'Candidates', value: String(recSummary.totalCandidates || 0), color: PRIMARY },
    { label: 'Long Apps', value: String(recSummary.totalLongApps || 0), color: [8, 182, 212] as [number,number,number] },
    { label: 'Short Apps', value: String(recSummary.totalShortApps || 0), color: GREEN },
    { label: 'Total Apps', value: String(recSummary.totalApplications || 0), color: PRIMARY },
    { label: 'Interviews', value: String(recSummary.totalInterviews || 0), color: YELLOW },
    { label: 'Compliance Score', value: `${recSummary.avgComplianceScore || 0}%`, color: (recSummary.avgComplianceScore || 0) >= 80 ? GREEN : (recSummary.avgComplianceScore || 0) >= 60 ? YELLOW : RED },
  ]

  const boxW = (W - 20) / kpis.length
  kpis.forEach((kpi, i) => {
    const x = 10 + i * boxW
    doc.setFillColor(...LIGHT)
    doc.roundedRect(x, y, boxW - 2, 22, 2, 2, 'F')
    doc.setDrawColor(...kpi.color)
    doc.setLineWidth(0.8)
    doc.roundedRect(x, y, boxW - 2, 22, 2, 2, 'S')
    doc.setTextColor(...kpi.color)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(kpi.value, x + (boxW - 2) / 2, y + 12, { align: 'center' })
    doc.setTextColor(...GRAY)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.text(kpi.label, x + (boxW - 2) / 2, y + 19, { align: 'center' })
  })
  y += 30

  // Helpers
  const sectionHeader = (title: string, icon: string) => {
    if (y > 260) { doc.addPage(); y = 20 }
    doc.setFillColor(...PRIMARY)
    doc.rect(10, y, W - 20, 8, 'F')
    doc.setTextColor(...WHITE)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`${icon}  ${title}`, 14, y + 5.5)
    y += 12
  }

  const tableHeader = (cols: { label: string; w: number }[]) => {
    doc.setFillColor(230, 232, 255)
    doc.rect(10, y, W - 20, 7, 'F')
    doc.setTextColor(...NAVY)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    let cx = 12
    cols.forEach(c => { doc.text(c.label, cx, y + 4.8); cx += c.w })
    y += 7
    doc.setLineWidth(0.2)
    doc.setDrawColor(200, 200, 220)
  }

  const tableRow = (cols: { text: string; w: number; color?: [number,number,number] }[], shade: boolean) => {
    if (y > 265) { doc.addPage(); y = 20 }
    if (shade) { doc.setFillColor(248, 249, 255); doc.rect(10, y, W - 20, 6.5, 'F') }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    let cx = 12
    cols.forEach(c => {
      doc.setTextColor(...(c.color || BLACK))
      doc.text(String(c.text || '—').substring(0, 45), cx, y + 4.5)
      cx += c.w
    })
    doc.setDrawColor(220, 220, 235)
    doc.setLineWidth(0.1)
    doc.line(10, y + 6.5, W - 10, y + 6.5)
    y += 6.5
  }

  // ── 1. Candidate performance table ──
  sectionHeader('CANDIDATE DAILY MONITORING DETAILS', '📋')
  if (entries.length === 0) {
    doc.setTextColor(...GRAY); doc.setFontSize(8); doc.text('No entries recorded in this range.', 14, y + 4); y += 10
  } else {
    tableHeader([
      { label: 'Date', w: 18 }, { label: 'Candidate', w: 32 }, { label: 'Status', w: 18 },
      { label: 'Long', w: 10 }, { label: 'Short', w: 10 }, { label: 'Connect Twice', w: 22 },
      { label: 'English', w: 15 }, { label: 'Interview Status', w: 28 }, { label: 'Legitimacy', w: 25 },
      { label: 'Score', w: 12 }
    ])
    
    entries.forEach((e: any, i: number) => {
      const dt = e.monitoringDate ? new Date(e.monitoringDate).toLocaleDateString('en-IN') : '—'
      const statusColor = e.candidateStatus === 'Placed' ? GREEN : e.candidateStatus === 'Backout' ? RED : e.candidateStatus === 'Hold' ? YELLOW : BLACK
      const legitimacyColor = e.interviewLegitimacy === 'Legit' ? GREEN : e.interviewLegitimacy === 'Not Legit' ? RED : YELLOW
      const complianceColor = e.complianceScore >= 80 ? GREEN : e.complianceScore >= 60 ? YELLOW : RED

      tableRow([
        { text: dt, w: 18 },
        { text: e.candidateName || '—', w: 32 },
        { text: e.candidateStatus || '—', w: 18, color: statusColor },
        { text: String(e.longApplications || 0), w: 10 },
        { text: String(e.shortApplications || 0), w: 10 },
        { text: e.connectedTwiceToday === 'yes' ? 'Yes' : 'No', w: 22, color: e.connectedTwiceToday === 'yes' ? GREEN : RED },
        { text: e.communicatedInEnglish === 'yes' ? 'Yes' : 'No', w: 15, color: e.communicatedInEnglish === 'yes' ? GREEN : RED },
        { text: e.interviewStatus || '—', w: 28 },
        { text: e.interviewLegitimacy || '—', w: 25, color: legitimacyColor },
        { text: `${e.complianceScore || 0}%`, w: 12, color: complianceColor }
      ], i % 2 === 0)
    })
  }
  y += 6

  // ── 2. Red Flags ──
  sectionHeader('RED FLAGS & ESCALATIONS', '🚨')
  const flags: string[] = []
  entries.forEach((e: any) => {
    if (e.overallStatus !== 'achieved') {
      flags.push(`Candidate ${e.candidateName}: Applications below target (Long: ${e.longApplications || 0}/60, Short: ${e.shortApplications || 0}/40).`)
    }
    if (e.connectedTwiceToday === 'no') {
      flags.push(`Candidate ${e.candidateName}: Did not connect twice today. Reason: ${e.connectionReason || 'None'}`)
    }
    if (e.communicatedInEnglish === 'no') {
      flags.push(`Candidate ${e.candidateName}: English compliance violation. Reason: ${e.englishComplianceReason || 'None'}`)
    }
    if (e.interviewCount > 0 && e.interviewLegitimacy === 'Pending Verification') {
      flags.push(`Candidate ${e.candidateName}: Legitimacy pending. Analyst comment: ${e.legitimacyComment || 'None'}`)
    }
    if (!e.statusComment || e.statusComment.trim() === '') {
      flags.push(`Candidate ${e.candidateName}: Status comment missing.`)
    }
    if (e.candidateStatus === 'Backout') {
      flags.push(`Candidate ${e.candidateName}: Candidate Backout event. Comment: ${e.statusComment || 'None'}`)
    }
  })

  if (flags.length === 0) {
    doc.setTextColor(...GREEN); doc.setFontSize(8); doc.text('✓ Perfect Compliance. No red flags or violations detected.', 14, y + 4); y += 10
  } else {
    doc.setTextColor(...RED)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    flags.slice(0, 10).forEach(f => {
      if (y > 275) { doc.addPage(); y = 20 }
      doc.text(`• ${f.substring(0, 105)}`, 14, y + 4)
      y += 5
    })
    if (flags.length > 10) {
      doc.text(`• ...and ${flags.length - 10} more flags.`, 14, y + 4)
      y += 5
    }
    y += 5
  }

  // ── 3. Status Audit Trail ──
  sectionHeader('STATUS AUDIT TRAIL', '🛡️')
  if (statusAudits.length === 0) {
    doc.setTextColor(...GRAY); doc.setFontSize(8); doc.text('No candidate status changes recorded in this range.', 14, y + 4); y += 10
  } else {
    tableHeader([
      { label: 'Date', w: 25 }, { label: 'Candidate', w: 35 }, { label: 'Old Status', w: 25 },
      { label: 'New Status', w: 25 }, { label: 'Changed By', w: 35 }, { label: 'Status Reason', w: 45 }
    ])
    statusAudits.forEach((sa: any, i: number) => {
      const dt = sa.changedDate ? new Date(sa.changedDate).toLocaleDateString('en-IN') : '—'
      tableRow([
        { text: dt, w: 25 },
        { text: sa.candidateName || '—', w: 35 },
        { text: sa.oldStatus || '—', w: 25 },
        { text: sa.newStatus || '—', w: 25 },
        { text: sa.changedBy || '—', w: 35 },
        { text: sa.reason || '—', w: 45 }
      ], i % 2 === 0)
    })
  }
  y += 6

  // ── 5. Daily Context & Observations ──
  sectionHeader('DAILY CONTEXT & OBSERVATIONS', '📝')
  const obsEntries = entries.filter((e: any) => e.dailyObservation || e.dailyChallenge || e.processAnalystRemarks)
  if (obsEntries.length === 0) {
    doc.setTextColor(...GRAY); doc.setFontSize(8); doc.text('No daily context or remarks recorded in this range.', 14, y + 4); y += 10
  } else {
    tableHeader([
      { label: 'Date', w: 22 }, { label: 'Candidate', w: 35 }, { label: 'Observation / Challenge / Remarks', w: 123 }
    ])
    obsEntries.forEach((e: any, i: number) => {
      const dt = e.monitoringDate ? new Date(e.monitoringDate).toLocaleDateString('en-IN') : '—'
      const obsText = [
        e.dailyObservation ? `Obs: ${e.dailyObservation}` : '',
        e.dailyChallenge ? `Chall: ${e.dailyChallenge}` : '',
        e.processAnalystRemarks ? `Rem: ${e.processAnalystRemarks}` : ''
      ].filter(Boolean).join(' | ')

      tableRow([
        { text: dt, w: 22 },
        { text: e.candidateName || '—', w: 35 },
        { text: obsText, w: 123 }
      ], i % 2 === 0)
    })
  }
  y += 6

  // ── 4. Weekly/Monthly Statistics ──
  sectionHeader('PERFORMANCE STATS SUMMARY', '📊')
  const totalConns = entries.length;
  const twiceConns = entries.filter(e => e.connectedTwiceToday === 'yes').length;
  const englishConns = entries.filter(e => e.communicatedInEnglish === 'yes').length;
  const totalInt = entries.filter(e => e.interviewCount > 0).length;
  const verifiedInt = entries.filter(e => e.interviewCount > 0 && e.interviewLegitimacy === 'Legit').length;

  const followUpPct = totalConns ? Math.round((twiceConns / totalConns) * 100) : 100
  const englishPct = totalConns ? Math.round((englishConns / totalConns) * 100) : 100
  const legitimacyPct = totalInt ? Math.round((verifiedInt / totalInt) * 100) : 100

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BLACK)
  
  if (y > 260) { doc.addPage(); y = 20 }
  doc.text(`• Follow-Up Rate (Connected Twice): ${twiceConns}/${totalConns} (${followUpPct}%)`, 14, y + 4)
  y += 5
  doc.text(`• Language Compliance Rate (English): ${englishConns}/${totalConns} (${englishPct}%)`, 14, y + 4)
  y += 5
  doc.text(`• Interview Legitimacy Verification Rate: ${verifiedInt}/${totalInt} (${legitimacyPct}%)`, 14, y + 4)
  y += 10

  // ── Footer ─────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setFillColor(...NAVY)
    doc.rect(0, 285, W, 12, 'F')
    doc.setTextColor(180, 185, 255)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(`NetBounce Placement LLC — Process Analyst Executive ${reportType} Report`, 10, 292)
    doc.text(`Page ${p} of ${pageCount}  |  Generated: ${new Date().toLocaleString('en-IN')}`, W - 10, 292, { align: 'right' })
  }

  const filename = `${reportType}_Recruiter_Report_${recSummary.recruiterName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
  return filename
}
