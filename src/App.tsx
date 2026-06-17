import { useState } from 'react'
import Sidebar from './components/Sidebar.tsx'
import Header from './components/Header.tsx'
import Dashboard from './pages/Dashboard.tsx'
import RecruiterMonitoring from './pages/RecruiterMonitoring.tsx'
import CandidateCredentials from './pages/CandidateCredentials.tsx'

export type Page = 'dashboard' | 'recruiters' | 'credentials'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':    return <Dashboard />
      case 'recruiters':   return <RecruiterMonitoring />
      case 'credentials':  return <CandidateCredentials />
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
