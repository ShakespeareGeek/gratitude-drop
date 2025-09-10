import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Daily Gratitude Drop',
  description: '5 anonymous thank-you notes. One minute. Zero noise.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}