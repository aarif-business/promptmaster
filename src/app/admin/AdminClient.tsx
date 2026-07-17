'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Stats { totalUsers: number; totalSubmissions: number; avgAccuracy: number }
interface Challenge { id: string; title: string; difficulty: string; created_at: string; image_count?: number }

const EMPTY_FORM = {
  title: '', description: '', difficulty: 'beginner',
  image_topic: '', min_accuracy_to_pass: 70,
}

export default function AdminClient({
  stats, challenges, adminId,
}: { stats: Stats; challenges: Challenge[]; adminId: string }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [seedingId, setSeedingId] = useState<string | null>(null)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'min_accuracy_to_pass' ? Number(value) : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const response = await fetch('/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, created_by: adminId }),
    })

    const data = await response.json()
    setSaving(false)

    if (!response.ok) {
      setMessage(`Error: ${data.error || 'Unable to create challenge.'}`)
    } else {
      setMessage('Challenge created! Click "Seed Images" to populate its image pool.')
      setForm(EMPTY_FORM)
      router.refresh()
    }
  }

  const handleSeed = async (challengeId: string, title: string) => {
    setSeedingId(challengeId)
    setMessage('')
    const response = await fetch(`/api/challenges/${challengeId}/seed`, { method: 'POST' })
    const data = await response.json()
    setSeedingId(null)
    if (!response.ok) {
      setMessage(`Error seeding "${title}": ${data.error || 'Unknown error.'}`)
    } else {
      setMessage(`✓ "${title}" — ${data.seeded} new images seeded, ${data.skipped} already existed.`)
      router.refresh()
    }
  }

  const grouped = ['beginner', 'intermediate', 'advanced'].map(diff => ({
    diff,
    items: challenges.filter(c => c.difficulty === diff),
  }))

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      <div>
        <p className="font-sans text-xs tracking-[0.4em] uppercase text-steel/50 mb-2">Administration</p>
        <h1 className="font-serif text-4xl text-steel">Admin Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Total Scholars',      value: stats.totalUsers },
          { label: 'Total Submissions',   value: stats.totalSubmissions },
          { label: 'Avg Platform Score',  value: `${stats.avgAccuracy}%` },
        ].map(({ label, value }) => (
          <div key={label} className="card-classic text-center">
            <p className="font-serif text-4xl font-bold text-steel">{value}</p>
            <p className="font-sans text-xs tracking-widest uppercase text-slate/50 mt-2">{label}</p>
          </div>
        ))}
      </div>

      {message && (
        <p className={`text-xs font-sans px-3 py-2 border ${message.startsWith('Error') ? 'text-steel-dark border-steel/20 bg-steel/5' : 'text-steel border-steel-muted bg-steel-faint'}`}>
          {message}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Challenge Creator */}
        <div className="card-classic">
          <h2 className="font-serif text-2xl text-steel mb-5">Create Challenge</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Title">
              <input name="title" value={form.title} onChange={handleChange} className="input-classic" placeholder="The Lone Lighthouse" required />
            </Field>
            <Field label="Description">
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="input-classic resize-none" placeholder="Describe what the user must achieve…" required />
            </Field>
            <Field label="Difficulty">
              <select name="difficulty" value={form.difficulty} onChange={handleChange} className="input-classic">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </Field>
            <Field label="Image Topic (comma-separated keywords)">
              <input name="image_topic" value={form.image_topic} onChange={handleChange} className="input-classic" placeholder="lighthouse, coast, ocean" required />
              <p className="font-sans text-xs text-slate/40 mt-1">After creating, click "Seed Images" to download and map images via Gemini.</p>
            </Field>
            <Field label={`Min Accuracy to Pass: ${form.min_accuracy_to_pass}%`}>
              <input type="range" name="min_accuracy_to_pass" min={30} max={95} step={5} value={form.min_accuracy_to_pass} onChange={handleChange} className="w-full accent-crimson" />
            </Field>
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? 'Creating…' : 'Publish Challenge'}
            </button>
          </form>
        </div>

        {/* Challenge List grouped by difficulty */}
        <div className="space-y-6">
          {grouped.map(({ diff, items }) => (
            <div key={diff} className="card-classic">
              <h2 className="font-serif text-xl text-steel mb-4 capitalize">{diff} <span className="font-sans text-sm text-slate/40">({items.length})</span></h2>
              <div className="divide-y divide-fog-border">
                {items.length === 0 && (
                  <p className="font-sans text-sm text-slate/40 italic py-3">No challenges yet.</p>
                )}
                {items.map(c => (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-serif text-sm text-steel font-semibold truncate">{c.title}</p>
                      <p className="font-sans text-xs text-slate/40 mt-0.5">
                        {c.image_count != null ? `${c.image_count} images seeded` : 'Not seeded'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary text-xs px-3 py-1 shrink-0"
                      disabled={seedingId === c.id}
                      onClick={() => handleSeed(c.id, c.title)}
                    >
                      {seedingId === c.id ? 'Seeding…' : 'Seed Images'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-sans text-xs tracking-widest uppercase text-slate/60 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
