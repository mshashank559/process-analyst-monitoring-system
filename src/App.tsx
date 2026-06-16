import { useState } from 'react'
import Sidebar from './components/Sidebar.tsx'
import Header from './components/Header.tsx'
import Dashboard from './pages/Dashboard.tsx'
import RecruiterMonitoring from './pages/RecruiterMonitoring.tsx'
import CandidateMonitoring from './pages/CandidateMonitoring.tsx'
import DailyTasks from './pages/DailyTasks.tsx'
import DailyUpdates from './pages/DailyUpdates.tsx'
import DailyReporting from './pages/DailyReporting.tsx'
import IssueTracker from './pages/IssueTracker.tsx'
import HistoricalRecords from './pages/HistoricalRecords.tsx'
import AuditLogs from './pages/AuditLogs.tsx'
import Settings from './pages/Settings.tsx'
import PerformanceIntel from './pages/PerformanceIntel.tsx'
import ProcessAnalystMonitoring from './pages/ProcessAnalystMonitoring.tsx'

export type Page =
  | 'dashboard' | 'tasks' | 'updates' | 'recruiters' | 'candidates'
  | 'reports' | 'issues' | 'history' | 'audit' | 'settings' | 'performance'
  | 'process_monitoring'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':    return <Dashboard />
      case 'recruiters':   return <RecruiterMonitoring />
      case 'candidates':   return <CandidateMonitoring />
      case 'tasks':        return <DailyTasks />
      case 'updates':      return <DailyUpdates />
      case 'reports':      return <DailyReporting />
      case 'issues':       return <IssueTracker />
      case 'history':      return <HistoricalRecords />
      case 'audit':        return <AuditLogs />
      case 'settings':     return <Settings />
      case 'performance':  return <PerformanceIntel />
      case 'process_monitoring': return <ProcessAnalystMonitoring />
      default:             return <Dashboard />
    }
  }

  return (
    <div className="app-shell">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="main-area">
        <Header currentPage={currentPage} />
        <main className="page-content">{renderPage()}</main>
      </div>
    </div>
  )
}
