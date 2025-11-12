import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HumanSign - Keystroke Notary',
  description: 'Cryptographic Proof of Human Authorship',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}