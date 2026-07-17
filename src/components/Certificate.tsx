'use client'

import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'

interface Props {
  userName: string
  challengeTitle: string
  difficulty: string
  score: number
  date?: string
}

export default function Certificate({ userName, challengeTitle, difficulty, score, date }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const download = async () => {
    if (!ref.current) return
    setDownloading(true)
    const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true, backgroundColor: null })
    const link = document.createElement('a')
    link.download = `certificate-${userName.replace(/\s+/g, '-')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setDownloading(false)
  }

  const dateStr = date ?? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const diffColor = difficulty === 'advanced' ? '#b45309' : difficulty === 'intermediate' ? '#6d28d9' : '#0369a1'

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Certificate */}
      <div
        ref={ref}
        style={{
          width: 800,
          minHeight: 560,
          background: 'linear-gradient(135deg, #f8f6f2 0%, #eee9e0 100%)',
          border: '12px solid #c8b89a',
          boxShadow: 'inset 0 0 0 4px #e8ddd0',
          fontFamily: 'Georgia, serif',
          padding: '48px 64px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
        }}
      >
        {/* Corner ornaments */}
        {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
          <div key={i} className={`absolute ${pos} text-2xl opacity-40`} style={{ color: '#8b6f47' }}>✦</div>
        ))}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#8b6f47', margin: 0 }}>
            The Academy of Artificial Eloquence
          </p>
          <div style={{ width: 120, height: 1, background: '#c8b89a', margin: '10px auto' }} />
          <h1 style={{ fontSize: 42, color: '#3d2b1f', margin: 0, fontWeight: 'normal', letterSpacing: '0.05em' }}>
            Certificate
          </h1>
          <p style={{ fontSize: 13, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#8b6f47', margin: '4px 0 0' }}>
            of Achievement
          </p>
        </div>

        <div style={{ width: 200, height: 1, background: '#c8b89a', margin: '20px auto' }} />

        {/* Body */}
        <p style={{ fontSize: 14, color: '#6b5744', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
          This certifies that
        </p>
        <h2 style={{ fontSize: 36, color: '#1e1410', margin: '8px 0', fontStyle: 'italic', fontWeight: 'normal' }}>
          {userName}
        </h2>
        <p style={{ fontSize: 14, color: '#6b5744', margin: '4px 0 16px', textAlign: 'center', lineHeight: 1.7 }}>
          has successfully completed <strong style={{ color: '#3d2b1f' }}>{challengeTitle}</strong>
          <br />with a semantic accuracy score of
        </p>

        {/* Score badge */}
        <div style={{
          background: diffColor,
          color: '#fff',
          borderRadius: 999,
          padding: '8px 32px',
          fontSize: 28,
          fontWeight: 'bold',
          letterSpacing: '0.05em',
          margin: '4px 0 16px',
        }}>
          {score}%
        </div>

        <div style={{
          display: 'inline-block',
          background: `${diffColor}18`,
          border: `1px solid ${diffColor}44`,
          borderRadius: 999,
          padding: '4px 20px',
          fontSize: 12,
          color: diffColor,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: 24,
        }}>
          {difficulty} level
        </div>

        <div style={{ width: 200, height: 1, background: '#c8b89a', margin: '4px auto 20px' }} />

        {/* Footer row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#8b6f47', margin: '0 0 4px', letterSpacing: '0.1em' }}>DATE ISSUED</p>
            <p style={{ fontSize: 13, color: '#3d2b1f', margin: 0 }}>{dateStr}</p>
          </div>

          {/* Stamp */}
          <div style={{
            width: 100, height: 100,
            borderRadius: '50%',
            border: '3px solid #8b6f47',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            opacity: 0.7,
            gap: 2,
          }}>
            <span style={{ fontSize: 22 }}>🎓</span>
            <p style={{ fontSize: 8, color: '#8b6f47', margin: 0, letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.4 }}>
              Prompt<br />Master
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 120, height: 1, background: '#8b6f47', marginBottom: 4 }} />
            <p style={{ fontSize: 11, color: '#8b6f47', margin: 0, letterSpacing: '0.1em' }}>AUTHORIZED SEAL</p>
          </div>
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={download}
        disabled={downloading}
        className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2"
      >
        {downloading ? 'Generating…' : '⬇ Download Certificate'}
      </button>
    </div>
  )
}
