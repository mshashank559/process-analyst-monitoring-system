import { Bell, Search, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { Page } from '../App'

const PAGE_TITLES: Record<Page, string> = {
  dashboard:   'Marketing Command Center',
  recruiters:  'Recruiter Monitoring',
}

const now = new Date()
const DATE_STR = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

export default function Header({ currentPage }: { currentPage: Page }) {
  const [dark, setDark] = useState(() => !document.documentElement.classList.contains('light'))
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.remove('light')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.add('light')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  useEffect(() => {
    const fetchStats = () => {
      fetch('/api/dashboard/stats')
        .then(r => r.json())
        .then(d => {
          if (d && typeof d === 'object') {
            const count = d.activeCandidates || 0
            setNotifCount(count)
          }
        })
        .catch(() => {})
    }
    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-title">{PAGE_TITLES[currentPage]}</div>
        <div className="header-date">{DATE_STR}</div>
      </div>
      <div className="header-search">
        <Search />
        <input placeholder="Search anything…" />
      </div>
      <div className="header-actions">
        <div className="icon-btn" onClick={() => setDark(!dark)}>
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </div>
        <div className="icon-btn">
          <Bell size={16} />
          {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
        </div>
        <div className="header-avatar">S</div>
      </div>
    </header>
  )
}
