'use client'

import dynamic from 'next/dynamic'

const Certificate = dynamic(() => import('@/components/Certificate'), { ssr: false })

export default function CertificatePreviewPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-16 px-4 bg-fog-muted">
      <p className="font-sans text-xs tracking-widest uppercase text-slate/40 mb-8">Certificate Preview</p>
      <Certificate
        userName="Aarif Khan"
        challengeTitle="Challenge 1"
        difficulty="beginner"
        score={82}
        date="June 15, 2025"
      />
    </div>
  )
}
