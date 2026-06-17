import jsPDF from 'jspdf'

export interface RecruiterPDFData {
  date: string | Date
  srName: string
  recruiterName: string
  candidateName: string
  candidateStatus: string
  longApps: number
  shortApps: number
  totalApps: number
  interviewCount: number
  interviewStatus: string
  interviewDate: string | Date
  gchat: string
  gchatFollowUp: string
  firstCallDone: string
  secondFollowUp: string
  followUpNotes: string
  targetedProfile: string
  remarks: string
}

export function generateRecruiterLandscapePDF(data: RecruiterPDFData[], dateRange: string) {
  // A4 Landscape: 297mm x 210mm
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = 297
  const H = 210
  let y = 0

  const PRIMARY = [30, 34, 208] as [number, number, number]
  const NAVY = [7, 0, 77] as [number, number, number]
  const WHITE = [255, 255, 255] as [number, number, number]
  const GRAY = [100, 100, 120] as [number, number, number]
  const BLACK = [20, 20, 40] as [number, number, number]
  const GREEN = [34, 197, 94] as [number, number, number]
  const RED = [239, 68, 68] as [number, number, number]
  const YELLOW = [234, 179, 8] as [number, number, number]

  const drawHeader = (_pageNum: number) => {
    // Header Banner
    doc.setFillColor(...NAVY)
    doc.rect(0, 0, W, 25, 'F')

    doc.setFillColor(...PRIMARY)
    doc.rect(0, 23, W, 2, 'F')

    // Title
    doc.setTextColor(...WHITE)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('NETBOUNCE PLACEMENT LLC', 10, 11)
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(180, 185, 255)
    doc.text('Recruiter Daily Monitoring Report', 10, 17)

    // Date range badge
    doc.setFillColor(30, 34, 208)
    doc.roundedRect(W - 100, 7, 90, 10, 1.5, 1.5, 'F')
    doc.setTextColor(...WHITE)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.text(dateRange, W - 55, 13.5, { align: 'center' })
  }

  const tableHeader = () => {
    doc.setFillColor(230, 232, 255)
    doc.rect(10, y, W - 20, 8, 'F')
    doc.setTextColor(...NAVY)
    doc.setFontSize(5.5)
    doc.setFont('helvetica', 'bold')

    const cols = [
      { label: 'Date', w: 15 },
      { label: 'SR Name', w: 18 },
      { label: 'Recruiter', w: 18 },
      { label: 'Candidate', w: 18 },
      { label: 'Status', w: 12 },
      { label: 'Long', w: 8 },
      { label: 'Short', w: 8 },
      { label: 'Total', w: 8 },
      { label: 'Int Count', w: 12 },
      { label: 'Int Status', w: 15 },
      { label: 'Int Date', w: 15 },
      { label: 'GChat', w: 12 },
      { label: 'GChat F/U', w: 12 },
      { label: '1st Call', w: 12 },
      { label: '2nd F/U', w: 15 },
      { label: 'F/U Notes', w: 25 },
      { label: 'Targeted', w: 12 },
      { label: 'Remarks', w: 22 }
    ]

    let cx = 12
    cols.forEach(c => {
      doc.text(c.label, cx, y + 5.5)
      cx += c.w
    })
    y += 8
    doc.setLineWidth(0.15)
    doc.setDrawColor(180, 180, 200)
  }

  const tableRow = (item: RecruiterPDFData, i: number) => {
    if (y > H - 25) {
      doc.addPage()
      drawHeader(doc.getNumberOfPages())
      y = 32
      tableHeader()
    }

    if (i % 2 === 0) {
      doc.setFillColor(248, 249, 255)
      doc.rect(10, y, W - 20, 7, 'F')
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5)
    doc.setTextColor(...BLACK)

    const cols = [
      { text: item.date ? new Date(item.date).toLocaleDateString('en-IN') : '—', w: 15 },
      { text: item.srName, w: 18 },
      { text: item.recruiterName, w: 18 },
      { text: item.candidateName, w: 18 },
      { text: item.candidateStatus, w: 12, color: item.candidateStatus?.toLowerCase() === 'active' ? GREEN : item.candidateStatus?.toLowerCase() === 'hold' ? YELLOW : BLACK },
      { text: String(item.longApps ?? 0), w: 8 },
      { text: String(item.shortApps ?? 0), w: 8 },
      { text: String(item.totalApps ?? 0), w: 8 },
      { text: String(item.interviewCount ?? 0), w: 12 },
      { text: item.interviewStatus, w: 15 },
      { text: item.interviewDate ? new Date(item.interviewDate).toLocaleDateString('en-IN') : '—', w: 15 },
      { text: item.gchat, w: 12 },
      { text: item.gchatFollowUp, w: 12 },
      { text: item.firstCallDone, w: 12, color: item.firstCallDone?.toLowerCase() === 'yes' ? GREEN : item.firstCallDone?.toLowerCase() === 'no' ? RED : BLACK },
      { text: item.secondFollowUp, w: 15 },
      { text: item.followUpNotes, w: 25 },
      { text: item.targetedProfile, w: 12, color: item.targetedProfile?.toLowerCase() === 'yes' ? GREEN : item.targetedProfile?.toLowerCase() === 'no' ? RED : BLACK },
      { text: item.remarks, w: 22 }
    ]

    let cx = 12
    cols.forEach(c => {
      const textVal = String(c.text || '—')
      // Substring long texts to fit column width
      let displayVal = textVal
      const charLimit = Math.max(6, Math.floor(c.w * 1.5))
      if (textVal.length > charLimit) {
        displayVal = textVal.substring(0, charLimit - 3) + '...'
      }
      doc.setTextColor(...(c.color || BLACK))
      doc.text(displayVal, cx, y + 4.8)
      cx += c.w
    })

    doc.setDrawColor(220, 220, 235)
    doc.setLineWidth(0.1)
    doc.line(10, y + 7, W - 10, y + 7)
    y += 7
  }

  // Draw Page 1
  drawHeader(1)
  y = 32
  tableHeader()

  if (data.length === 0) {
    doc.setTextColor(...GRAY)
    doc.setFontSize(8)
    doc.text('No entries found for this report range.', 15, y + 8)
  } else {
    data.forEach((item, i) => {
      tableRow(item, i)
    })
  }

  // Draw Footer on all pages
  const pageCount = doc.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setFillColor(...NAVY)
    doc.rect(0, H - 10, W, 10, 'F')
    doc.setTextColor(180, 185, 255)
    doc.setFontSize(6.5)
    doc.text('NetBounce Placement LLC — Confidential Daily Monitoring Report', 10, H - 4)
    doc.text(`Page ${p} of ${pageCount}  |  Generated: ${new Date().toLocaleString('en-IN')}`, W - 10, H - 4, { align: 'right' })
  }

  const filename = `NetBounce_Recruiter_Report_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
  return filename
}
