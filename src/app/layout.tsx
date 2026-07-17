import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'

const BASE_URL = 'https://promptmaster.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'PromptMaster — Master the Art of Prompt Engineering',
    template: '%s | PromptMaster',
  },
  description:
    'Level up your AI prompt engineering skills through gamified challenges. Describe images, earn XP, unlock stages, and collect medals — from beginner to advanced.',
  keywords: [
    'prompt engineering', 'AI prompts', 'learn prompt engineering', 'gamified AI learning',
    'image description challenges', 'AI training', 'prompt mastery', 'LLM prompts',
    'generative AI', 'prompt writing practice', 'AI skills', 'prompt engineering course',
  ],
  authors: [{ name: 'PromptMaster' }],
  creator: 'PromptMaster',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'PromptMaster',
    title: 'PromptMaster — Master the Art of Prompt Engineering',
    description: 'Gamified prompt engineering training. Describe images with AI precision, earn XP, unlock realms, and become a Grand Master.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'PromptMaster — Gamified Prompt Engineering' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptMaster — Master the Art of Prompt Engineering',
    description: 'Gamified prompt engineering training. Earn XP, unlock realms, collect medals.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: { canonical: BASE_URL },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-fog text-slate-dark">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-fog-border py-4 text-center text-xs font-sans text-slate/50 tracking-widest uppercase">
          PromptMaster Class &mdash; The Art of the Prompt
          <span className="mx-2 text-slate/30">·</span>
          Developed by{' '}
          <a
            href="https://lowkeywebdev.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-steel hover:text-steel-dark transition-colors normal-case"
          >
            Low Key Web Dev
          </a>
        </footer>
      </body>
    </html>
  )
}
