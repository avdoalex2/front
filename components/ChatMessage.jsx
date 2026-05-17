'use client'
import { User, Shield } from 'lucide-react'

export default function ChatMessage({ msg }) {
  const isUser = msg.role === 'user'

  return (
    <div style={{
      width: '100%',
      padding: '24px 0',
      background: isUser ? 'var(--bg-main)' : 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-light)',
      display: 'flex',
      justifyContent: 'center'
    }}>
      {/* ChatGPT Centered Inner Container */}
      <div style={{
        maxWidth: '740px', width: '100%', padding: '0 20px',
        display: 'flex', gap: 18, alignItems: 'flex-start'
      }}>

        {/* Avatar Badge */}
        <div style={{
          width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
          background: isUser ? '#e2e2e7' : 'var(--apple-green)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isUser ? 'var(--text-primary)' : '#ffffff',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          {isUser ? <User size={16} /> : <Shield size={16} />}
        </div>

        {/* Message Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{
            fontSize: '0.95rem', color: 'var(--text-primary)',
            lineHeight: 1.6, whiteSpace: 'pre-wrap', fontWeight: 400
          }}>
            {msg.content}
          </p>

          {/* Dynamic Visual Proof Card (Apple-Style Image Wrapper) */}
          {!isUser && msg.sources && msg.sources.map((src, idx) => src.image_base64 && (
            <div key={idx} style={{
              marginTop: 12, padding: 12, background: '#ffffff',
              borderRadius: 12, border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-subtle)', maxWidth: '480px',
              animation: 'fadeUp 0.25s ease'
            }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                🔍 Οπτική Τεκμηρίωση από: {src.filename || 'Invoice.pdf'} (Σελίδα {src.page || 1})
              </p>
              <img
                src={`data:image/jpeg;base64,${src.image_base64}`}
                alt="Visual Evidence Snippet"
                style={{ width: '100%', borderRadius: 6, display: 'block' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}