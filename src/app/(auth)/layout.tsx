import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Sign In — PromptMaster',
    template: '%s | PromptMaster',
  },
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
