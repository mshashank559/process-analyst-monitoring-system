import { useState, useEffect } from 'react'
import { Search, Plus, Eye, EyeOff, X, Key } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Credential {
  _id?: string
  seniorRecruiter: string
  recruiter: string
  candidateName: string
  email: string
  password: string
}

export default function CandidateCredentials() {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  // Form states
  const [seniorRecruiter, setSeniorRecruiter] = useState('')
  const [recruiter, setRecruiter] = useState('')
  const [candidateName, setCandidateName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchCredentials = async (query = '') => {
    try {
      setLoading(true)
      const res = await fetch(`/api/credentials?search=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setCredentials(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchCredentials(search)
    }, 300)
    return () => clearTimeout(delay)
  }, [search])

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const paginatedCredentials = credentials.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalPages = Math.ceil(credentials.length / pageSize) || 1

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!candidateName.trim() || !email.trim() || !password.trim()) {
      alert('Candidate Name, Email and Password are required.')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seniorRecruiter,
          recruiter,
          candidateName,
          email,
          password
        })
      })

      if (res.ok) {
        // Reset states
        setSeniorRecruiter('')
        setRecruiter('')
        setCandidateName('')
        setEmail('')
        setPassword('')
        setModalOpen(false)
        fetchCredentials(search)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to save credential.')
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred while saving.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="analytics-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Search & Actions Toolbar */}
      <div className="flex-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'rgba(30, 30, 50, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '8px 12px', width: '320px' }}>
          <Search size={16} style={{ color: 'rgba(255,255,255,0.4)', marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Search by Name, Recruiter, Email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '14px' }}
          />
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'linear-gradient(135deg, #1e22d0 0%, #101270 100%)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1.0)')}
        >
          <Plus size={16} />
          <span>Add Credential</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="table-container" style={{ overflowX: 'auto', background: 'rgba(15, 15, 30, 0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>Loading candidate credentials...</div>
        ) : credentials.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>No candidate credentials found.</div>
        ) : (
          <table className="recruiter-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '16px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Senior Recruiter</th>
                <th style={{ padding: '16px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Recruiter Name</th>
                <th style={{ padding: '16px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Candidate Name</th>
                <th style={{ padding: '16px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Marketing Mail ID</th>
                <th style={{ padding: '16px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Password</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCredentials.map((cred) => {
                const credId = cred._id || cred.candidateName;
                const showPass = !!visiblePasswords[credId];
                return (
                  <tr
                    key={credId}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '16px', color: '#f0f0ff', fontWeight: 500 }}>{cred.seniorRecruiter || '—'}</td>
                    <td style={{ padding: '16px', color: '#f0f0ff' }}>{cred.recruiter || '—'}</td>
                    <td style={{ padding: '16px', color: '#fff', fontWeight: 600 }}>{cred.candidateName}</td>
                    <td style={{ padding: '16px', color: 'rgba(240, 240, 255, 0.8)' }}>{cred.email || '—'}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: showPass ? 'monospace' : 'inherit', letterSpacing: showPass ? '0' : '3px', color: showPass ? '#60a5fa' : 'rgba(255,255,255,0.4)', fontSize: showPass ? '14px' : '16px' }}>
                          {showPass ? cred.password : '••••••••'}
                        </span>
                        {cred.password && (
                          <button
                            onClick={() => togglePassword(credId)}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'inline-flex', padding: '4px' }}
                            title={showPass ? 'Hide Password' : 'Show Password'}
                          >
                            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(255, 255, 255, 0.01)',
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
              Showing <span style={{ color: '#fff', fontWeight: 500 }}>{((currentPage - 1) * pageSize) + 1}</span> to <span style={{ color: '#fff', fontWeight: 500 }}>{Math.min(currentPage * pageSize, credentials.length)}</span> of <span style={{ color: '#fff', fontWeight: 500 }}>{credentials.length}</span> entries
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
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
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff'
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                Page <span style={{ color: '#fff' }}>{currentPage}</span> of <span style={{ color: '#fff' }}>{totalPages}</span>
              </span>
              <button
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
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: 'rgba(20, 20, 35, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key style={{ color: '#60a5fa' }} size={20} />
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 600 }}>New Candidate Credential</h3>
                </div>
                <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Senior Recruiter Name</label>
                  <input
                    type="text"
                    value={seniorRecruiter}
                    onChange={e => setSeniorRecruiter(e.target.value)}
                    placeholder="e.g. Smit H Patel"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#fff', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Recruiter Name</label>
                  <input
                    type="text"
                    value={recruiter}
                    onChange={e => setRecruiter(e.target.value)}
                    placeholder="e.g. Meghal Patel"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#fff', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Candidate Name *</label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={e => setCandidateName(e.target.value)}
                    placeholder="e.g. Somil Urmil Shah"
                    required
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#fff', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Marketing Mail ID *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="somil.s@mycvscout.com"
                    required
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#fff', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Password *</label>
                  <input
                    type="text"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Somil@3003"
                    required
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#fff', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '10px 16px', color: '#fff', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ background: 'linear-gradient(135deg, #1e22d0 0%, #101270 100%)', border: 'none', borderRadius: '8px', padding: '10px 20px', color: '#fff', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
                  >
                    {submitting ? 'Saving...' : 'Save Credential'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
