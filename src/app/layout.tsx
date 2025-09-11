import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Daily Gratitude Drop',
  description: '5 anonymous thank-you notes. One minute. Zero noise.',
  openGraph: {
    title: 'The Daily Gratitude Drop',
    description: '5 anonymous thank-you notes. One minute. Zero noise.',
    url: 'https://www.gratitudedrop.com',
    siteName: 'Gratitude Drop',
    images: [
      {
        url: '/card.png',
        width: 1200,
        height: 630,
        alt: 'The Daily Gratitude Drop',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Daily Gratitude Drop',
    description: '5 anonymous thank-you notes. One minute. Zero noise.',
    images: ['/card.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script defer data-domain="gratitudedrop.com" src="https://plausible.io/js/script.js"></script>
      </head>
      <body className="bg-slate-50 text-slate-800 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}