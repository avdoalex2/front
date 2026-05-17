'use client'
import { useState } from 'react'
import { FileText, Plus, ChevronLeft, ChevronRight, ShieldCheck, Search, X } from 'lucide-react'

export default function Sidebar({ history = [], activeId, onSelect, onNew, summary }) {
  const [collapsed, setCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  const [selectedDateFilter, setSelectedDateFilter] = useState(null)

  const sidebarWidth = collapsed ? 60 : 280

  // 🧮 1. Map-άρισμα ΜΟΝΟ ΤΩΝ ΠΡΑΓΜΑΤΙΚΩΝ ΕΓΓΡΑΦΩΝ (Εξαιρούνται τα απλά Chat)
  const fileCountsByDate = {}
  history.forEach(item => {
    // ✨ Η ΔΙΟΡΘΩΣΗ: Μετράμε τον αριθμό εγγράφων ΜΟΝΟ αν ΔΕΝ είναι Γενική Συνομιλία
    if (!item.summary?.isGeneralChat) {
      const dateStr = item.summary?.date || '17/05/2026'
      fileCountsByDate[dateStr] = (fileCountsByDate[dateStr] || 0) + 1
    }
  })

  // 🔍 2. Αναβαθμισμένο Φιλτράρισμα Ιστορικού
  const filteredHistory = history.filter(item => {
    const matchesSearch = item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.summary?.vendor && item.summary.vendor.toLowerCase().includes(searchQuery.toLowerCase()))

    const itemDate = item.summary?.date || '17/05/2026'
    const matchesDate = !selectedDateFilter || itemDate === selectedDateFilter

    return matchesSearch && matchesDate
  })

  // 🗓️ 3. Μαθηματικός Υπολογισμός Ρεαλιστικού Ημερολογίου
  const weekdays = ['Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ', 'Κ']
  const monthNames = [
    "Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος",
    "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"
  ]

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const startPadding = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  const calendarCells = []
  for (let i = 0; i < startPadding; i++) {
    calendarCells.push({ isPadding: true, day: null })
  }
  for (let d = 1; d <= totalDaysInMonth; d++) {
    calendarCells.push({ isPadding: false, day: d })
  }

  return (
    <aside style={{
      width: sidebarWidth, minWidth: sidebarWidth, height: '100vh',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-light)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
      overflow: 'hidden', flexShrink: 0, zIndex: 100
    }}>

      {/* Sidebar Header */}
      <div style={{
        padding: '20px 16px', display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid #e5e5ea'
      }}>
        {!collapsed && (
          <span style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            info<span style={{ color: 'var(--apple-green)', fontWeight: 800 }}>4</span>invo
          </span>
        )}
        <button onClick={() => setCollapsed(v => !v)} style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          display: 'flex', padding: 6, borderRadius: 8, cursor: 'pointer'
        }}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Button: Νέα Συνομιλία */}
      <div style={{ padding: '14px 12px 6px 12px' }}>
        <button onClick={onNew} style={{
          width: '100%', padding: collapsed ? '10px' : '11px 14px',
          background: '#ffffff', color: 'var(--text-primary)',
          border: '1px solid #d1d1d6', borderRadius: '12px',
          fontWeight: 600, fontSize: '0.88rem', display: 'flex',
          alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start',
          boxShadow: 'var(--shadow-subtle)', cursor: 'pointer'
        }}>
          <Plus size={16} color="var(--apple-green)" />
          {!collapsed && 'Νέα Συνομιλία'}
        </button>
      </div>

      {/* Search Bar */}
      {!collapsed && (
        <div style={{ padding: '6px 12px 10px 12px', position: 'relative' }}>
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Αναζήτηση συνομιλιών..."
            style={{
              width: '100%', padding: '8px 12px 8px 34px',
              background: '#ffffff', border: '1px solid #e5e5ea',
              borderRadius: '10px', fontSize: '0.82rem', color: 'var(--text-primary)', outline: 'none'
            }}
          />
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '22px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      )}

      {/* 📅 4. REALISTIC APPLE ACTIVITY CALENDAR */}
      {!collapsed && (
        <div style={{
          margin: '4px 12px 12px 12px', padding: '14px 12px', borderRadius: '16px',
          background: '#ffffff', border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-subtle)', display: 'flex', flexDirection: 'column', gap: 8
        }}>
          {/* Controls: Month & Year Selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {monthNames[currentMonth]}
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                Έτος: {currentYear}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', border: '1px solid #e5e5ea', borderRadius: '6px', background: 'var(--bg-secondary)' }}>
                <button onClick={() => { if (currentMonth > 0) { setCurrentMonth(currentMonth - 1) } else { setCurrentMonth(11); setCurrentYear(currentYear - 1) } }} style={{ background: 'none', border: 'none', padding: '4px 6px', cursor: 'pointer', display: 'flex' }}>
                  <ChevronLeft size={14} color="var(--text-primary)" />
                </button>
                <button onClick={() => { if (currentMonth < 11) { setCurrentMonth(currentMonth + 1) } else { setCurrentMonth(0); setCurrentYear(currentYear + 1) } }} style={{ background: 'none', border: 'none', padding: '4px 6px', cursor: 'pointer', display: 'flex', borderLeft: '1px solid #e5e5ea' }}>
                  <ChevronRight size={14} color="var(--text-primary)" />
                </button>
              </div>
              <div style={{ display: 'flex', border: '1px solid #e5e5ea', borderRadius: '6px', background: 'var(--bg-secondary)' }}>
                <button onClick={() => setCurrentYear(currentYear - 1)} style={{ background: 'none', border: 'none', padding: '4px 5px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>-Y</button>
                <button onClick={() => setCurrentYear(currentYear + 1)} style={{ background: 'none', border: 'none', padding: '4px 5px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, color: 'var(--apple-green)', borderLeft: '1px solid #e5e5ea' }}>+Y</button>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textItem: 'center', marginBottom: 2 }}>
            {weekdays.map((w, idx) => (
              <span key={idx} style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>{w}</span>
            ))}
          </div>

          {/* 7-Column Grid Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {calendarCells.map((cell, idx) => {
              if (cell.isPadding) {
                return <div key={`pad-${idx}`} style={{ height: '36px' }} />
              }

              const dayStr = cell.day < 10 ? `0${cell.day}` : cell.day
              const monthStr = (currentMonth + 1) < 10 ? `0${currentMonth + 1}` : (currentMonth + 1)
              const fullDateStr = `${dayStr}/${monthStr}/${currentYear}`

              const fileCount = fileCountsByDate[fullDateStr] || 0
              const isCurrentFilter = selectedDateFilter === fullDateStr

              return (
                <div
                  key={`day-${cell.day}`}
                  onClick={() => {
                    if (fileCount > 0) {
                      setSelectedDateFilter(isCurrentFilter ? null : fullDateStr)
                    }
                  }}
                  style={{
                    height: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '6px', cursor: fileCount > 0 ? 'pointer' : 'default',
                    background: isCurrentFilter ? 'var(--apple-green)' : (fileCount > 0 ? 'var(--green-light)' : 'transparent'),
                    border: fileCount > 0 ? '1px solid var(--apple-green)' : '1px solid transparent',
                    boxShadow: isCurrentFilter ? '0 4px 10px rgba(0,128,96,0.3)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                  title={fileCount > 0 ? `Κάντε κλικ για προβολή των ${fileCount} εγγράφων` : ''}
                >
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: fileCount > 0 ? 700 : 500,
                    color: isCurrentFilter ? '#ffffff' : (fileCount > 0 ? 'var(--apple-green)' : 'var(--text-primary)')
                  }}>
                    {cell.day}
                  </span>

                  {fileCount > 0 && (
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      color: isCurrentFilter ? '#ffffff' : 'var(--apple-green)',
                      marginTop: '1px'
                    }}>
                      {fileCount}📄
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ✨ GRAPHIC BADGE: Εμφανίζει ποιο φίλτρο ημερομηνίας είναι ενεργό με κουμπί X (Clear) */}
      {!collapsed && selectedDateFilter && (
        <div style={{
          margin: '2px 12px 10px 12px', padding: '6px 10px', borderRadius: '10px',
          background: 'var(--green-light)', border: '1px solid rgba(0, 128, 96, 0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          animation: 'fadeUp 0.3s ease'
        }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--apple-green)' }}>
            📅 Έγγραφα: {selectedDateFilter}
          </span>
          <button
            onClick={() => setSelectedDateFilter(null)}
            style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer', color: 'var(--apple-green)' }}
            title="Καθαρισμός φίλτρου"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Chat History List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
        {!collapsed && filteredHistory.length > 0 && (
          <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, paddingLeft: 8 }}>
            {selectedDateFilter ? 'ΕΓΓΡΑΦΑ ΗΜΕΡΑΣ' : 'ΙΣΤΟΡΙΚΟ ΣΥΝΟΜΙΛΙΩΝ'}
          </p>
        )}

        {!collapsed && filteredHistory.length === 0 && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 10px' }}>
            Δεν βρέθηκαν συνομιλίες/έγγραφα.
          </p>
        )}

        {filteredHistory.map(item => {
          const isSelected = item.fileId === activeId
          return (
            <button key={item.fileId} onClick={() => onSelect(item)} style={{
              width: '100%', padding: '9px 12px', marginBottom: 3,
              background: isSelected ? '#ffffff' : 'transparent',
              color: isSelected ? 'var(--text-primary)' : '#48484a',
              border: 'none', borderRadius: '10px', textAlign: 'left',
              fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 10,
              fontWeight: isSelected ? 600 : 400, cursor: 'pointer',
              boxShadow: isSelected ? 'var(--shadow-subtle)' : 'none',
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
            }}>
              <FileText size={15} color={isSelected ? 'var(--apple-green)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.filename}</span>}
            </button>
          )
        })}
      </div>

      {/* Bottom Summary Card */}
      {!collapsed && summary && !summary.isGeneralChat && (
        <div style={{
          margin: '12px', padding: '14px', borderRadius: '14px',
          background: '#ffffff', border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-subtle)', animation: 'fadeUp 0.4s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <ShieldCheck size={16} color="var(--apple-green)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>ΣΥΝΟΨΗ ΕΓΓΡΑΦΟΥ</span>
          </div>

          {[['Εκδότης', summary.vendor], ['Ποσό', summary.total], ['Ημερ.', summary.date]].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '5px 0', borderBottom: '1px solid #f2f2f7' }}>
              <span style={{ color: 'var(--text-muted)' }}>{l}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{v}</span>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 4 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Τραπεζικός Έλεγχος</span>
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
              background: summary.IsPaid ? '#e3fcef' : '#ffebe6',
              color: summary.IsPaid ? '#006644' : '#bf2600'
            }}>{summary.IsPaid ? 'Εξοφλήθηκε' : 'Εκκρεμεί'}</span>
          </div>
        </div>
      )}
    </aside>
  )
}