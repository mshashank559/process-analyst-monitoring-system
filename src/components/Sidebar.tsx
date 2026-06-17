import { motion } from 'framer-motion'
import { LayoutDashboard, Users, LogOut, Key } from 'lucide-react'
import type { Page } from '../App'

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',             icon: LayoutDashboard },
  { id: 'recruiters',  label: 'Recruiter Monitoring',  icon: Users },
  { id: 'credentials', label: 'Candidate Credentials', icon: Key },
] as const

interface Props { currentPage: Page; onNavigate: (p: Page) => void }

export default function Sidebar({ currentPage, onNavigate }: Props) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img
          src="/logo_monogram.png"
          alt="NetBounce Placement LLC"
          style={{ height: 52, width: 'auto', maxWidth: 190, objectFit: 'contain' }}
          onError={e => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      </div>

      <nav className="sidebar-nav">
        <div className="section-label">MAIN MENU</div>
        {NAV.map((item, i) => {
          const Icon = item.icon
          const active = currentPage === item.id
          return (
            <motion.div
              key={item.id}
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => onNavigate(item.id as Page)}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ x: 3 }}
            >
              <Icon />
              <span>{item.label}</span>
              {active && (
                <motion.div
                  layoutId="active-pill"
                  style={{ position: 'absolute', inset: 0, borderRadius: 8, border: '1px solid rgba(30,34,208,0.6)', pointerEvents: 'none' }}
                />
              )}
            </motion.div>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">S</div>
          <div className="sidebar-user-info">
            <p>Shashank</p>
            <p>Process Analyst</p>
          </div>
          <LogOut size={15} style={{ marginLeft: 'auto', color: 'rgba(240,240,255,0.4)', cursor: 'pointer' }} />
        </div>
      </div>
    </div>
  )
}
