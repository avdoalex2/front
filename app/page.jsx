'use client'
import { useState, useRef, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import ChatMessage from '../components/ChatMessage'
import { UploadCloud, ArrowUp, Loader2, AlertCircle } from 'lucide-react'

// ΑΠΕΥΘΕΙΑΣ ΣΥΝΔΕΣΗ ΜΕ ΤΗΝ PYTHON
const BACKEND_URL = 'http://localhost:8000'

export default function Page() {
  const [history, setHistory] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [input, setInput] = useState('')

  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ── 🔗 REAL DIRECT FETCH CLIENT ──
  const apiAnalyze = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${BACKEND_URL}/documents/analyze`, { method: 'POST', body: formData })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.detail || 'Σφάλμα κατά την ανάλυση στο backend.')
    }
    return res.json()
  }

  const apiAsk = async (docId, question) => {
    const res = await fetch(`${BACKEND_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc_id: docId, question })
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.detail || 'Σφάλμα κατά την ανάκτηση απάντησης.')
    }
    return res.json()
  }

  // ── 🛠️ REAL UPLOAD ──
  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError(null)

    try {
      const res = await apiAnalyze(file)

      const f = k => res.fields?.[k]?.value ?? 'N/A'
      const sumData = {
        vendor: f('VendorName'),
        total: f('InvoiceTotal'),
        date: f('InvoiceDate'),
        items: res.line_items?.length || 1,
        IsPaid: res.fields?.IsPaid?.value ?? true,
        auditStatus: res.fields?.AuditStatus?.value || 'PASSED',
        auditNotes: res.fields?.AuditNotes?.value || 'Έλεγχος ολοκληρώθηκε.'
      }

      const newDoc = {
        fileId: res.doc_id,
        filename: file.name,
        summary: sumData,
        messages: [{
          role: 'assistant',
          content: `Γεια σας! Το σύστημα info4invo ανέλυσε με επιτυχία το έγγραφο "${file.name}" της εταιρείας ${sumData.vendor}.\n\nΤα δεδομένα αποθηκεύτηκαν στη βάση. Πώς μπορώ να σας βοηθήσω;`
        }]
      }

      setHistory(prev => [newDoc, ...prev])
      setActiveId(res.doc_id)
      setSummary(sumData)
      setMessages(newDoc.messages)
    } catch (err) {
      console.error(err)
      setError(`Αποτυχία: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // ── 💬 REAL RAG CHAT (ΜΕ AUTO-HISTORY ΓΙΑ ΓΕΝΙΚΕΣ ΣΥΝΟΜΙΛΙΕΣ) ──
  const handleSend = async (textToSend) => {
    const query = textToSend || input
    if (!query.trim() || loading) return

    const userMsg = { role: 'user', content: query }
    const nextMsgs = [...messages, userMsg]
    setMessages(nextMsgs)
    if (!textToSend) setInput('')
    setLoading(true)
    setError(null)

    let currentActiveId = activeId;
    const currentDoc = history.find(i => i.fileId === activeId);

    // Ελέγχουμε αν είναι συνομιλία χωρίς αρχείο (General Chat)
    const isGeneralChat = !activeId || currentDoc?.summary?.isGeneralChat;

    // ✨ Η ΜΑΓΕΙΑ: Αν είναι το 1ο μήνυμα χωρίς αρχείο, δημιουργούμε Ιστορικό!
    if (!currentActiveId) {
      currentActiveId = `chat_${Math.random().toString(36).substr(2, 9)}`;
      setActiveId(currentActiveId);

      // Βρίσκουμε τη σημερινή ημερομηνία για να ενημερωθεί το ημερολόγιο!
      const today = new Date();
      const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

      const newHistoryItem = {
        fileId: currentActiveId,
        filename: `💬 ${query.slice(0, 22)}${query.length > 22 ? '...' : ''}`, // Ο τίτλος στο Sidebar!
        summary: { date: todayStr, isGeneralChat: true },
        messages: nextMsgs
      }

      setHistory(prev => [newHistoryItem, ...prev])
      setSummary(newHistoryItem.summary)
    }

    try {
      // Αν είναι γενική συνομιλία, λέμε στο backend 'general_chat'. Αλλιώς, στέλνουμε το ID του εγγράφου.
      const targetBackendId = isGeneralChat ? 'general_chat' : currentActiveId
      const res = await apiAsk(targetBackendId, query)

      const botMsg = { role: 'assistant', content: res.answer, sources: res.sources || [] }
      const updatedMsgs = [...nextMsgs, botMsg]
      setMessages(updatedMsgs)

      // Ενημερώνουμε τα μηνύματα στη βάση του Sidebar
      setHistory(h => h.map(i => i.fileId === currentActiveId ? { ...i, messages: updatedMsgs } : i))
    } catch (err) {
      console.error(err)
      setError(`Σφάλμα: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const activeDoc = history.find(i => i.fileId === activeId)

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: 'transparent' }}>
      <Sidebar
        history={history} activeId={activeId} summary={summary}
        onNew={() => { setActiveId(null); setMessages([]); setSummary(null); setError(null); }}
        onSelect={(item) => { setActiveId(item.fileId); setSummary(item.summary); setMessages(item.messages); setError(null); }}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: '#fff2f0', borderBottom: '1px solid #ffccc7', color: '#ff4d4f', fontSize: '0.88rem', zIndex: 10 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 500 }}>{error}</span>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {messages.length === 0 ? (
            <div className="smooth-motion-node" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
              <h1 style={{ fontSize: '4.2rem', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: 14, color: 'var(--text-primary)' }}>
                info<span style={{ fontSize: '1.28em', fontWeight: '800', color: 'var(--apple-green)', display: 'inline-block', margin: '0 4px', transform: 'translateY(2px)' }}>4</span>invo
              </h1>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: 44, textAlign: 'center', maxWidth: '540px', lineHeight: 1.6 }}>
                Ανεβάστε το τιμολόγιο. Όλα τα δεδομένα σας αναλύονται και αποθηκεύονται με ασφάλεια στη βάση δεδομένων.
              </p>

              <label style={{
                width: '100%', maxWidth: '600px', height: '240px',
                border: '1px dashed #c8c8cc', borderRadius: '32px',
                background: 'rgba(245, 245, 247, 0.8)', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 14,
                cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: 'var(--shadow-subtle)',
                backdropFilter: 'blur(8px)'
              }}>
                <input type="file" onChange={handleFile} accept="image/*,application/pdf" style={{ display: 'none' }} />
                {loading ? <Loader2 size={40} color="var(--apple-green)" style={{ animation: 'spin 1s linear infinite' }} /> : <UploadCloud size={40} color="var(--text-muted)" />}
                <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {loading ? 'Ανάλυση και αποθήκευση στη βάση...' : 'Επιλέξτε ή σύρετε το τιμολόγιο εδώ'}
                </span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>PDF, PNG, JPG</span>
              </label>
            </div>
          ) : (
            <div className="smooth-motion-node" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '18px 32px', borderBottom: '1px solid var(--border-light)', background: '#ffffff', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 99, background: 'var(--apple-green)' }} />
                <span style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)' }}>{activeDoc?.filename || "Γενική Συνομιλία"}</span>
              </div>

              {messages.map((m, idx) => (
                <ChatMessage key={idx} msg={m} />
              ))}

              {loading && (
                <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
                  <div style={{ maxWidth: '760px', width: '100%', padding: '0 24px', display: 'flex', gap: 12, alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Το info4invo γράφει...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div style={{ padding: '24px 0 40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(transparent, #ffffff 40%)' }}>
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="chat-container-zoomed" style={{ position: 'relative' }}>
            <input
              type="text" value={input} onChange={e => setInput(e.target.value)}
              placeholder="Ρωτήστε το info4invo οτιδήποτε..."
              style={{
                width: '100%', padding: '20px 70px 20px 28px',
                background: 'var(--bg-main)', border: '1px solid #c8c8cc',
                borderRadius: '32px', fontSize: '1.05rem', color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-premium)', outline: 'none'
              }}
            />
            <button type="submit" disabled={!input.trim() || loading} style={{
              position: 'absolute', right: '38px', top: '50%', transform: 'translateY(-50%)',
              width: 44, height: 44, borderRadius: 99,
              background: input.trim() ? 'var(--apple-green)' : '#e2e2e7',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', transition: 'all 0.2s ease'
            }}>
              <ArrowUp size={22} strokeWidth={2.5} />
            </button>
          </form>

          {/* Δείχνουμε τα Badges ΜΟΝΟ αν δεν είναι Γενική Συνομιλία (δηλαδή αν έχουμε ανεβάσει αρχείο) */}
          {activeId && !activeDoc?.summary?.isGeneralChat && (
            <div className="chat-container-zoomed" style={{ display: 'flex', gap: 12, marginTop: '18px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
              {[
                { label: '📊 Ανάλυση Χρεώσεων', q: 'Δώσε μου μια αναλυτική λίστα των χρεώσεων.' },
                { label: '🏦 Στοιχεία Πληρωμής', q: 'Ποια είναι τα στοιχεία της εταιρείας και το ποσό;' }
              ].map((badge, idx) => (
                <button
                  key={idx} type="button" disabled={loading} onClick={() => handleSend(badge.q)}
                  style={{
                    padding: '10px 18px', borderRadius: '99px', background: '#ffffff', border: '1px solid #e5e5ea',
                    fontSize: '0.88rem', color: '#48484a', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-subtle)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                >
                  {badge.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}