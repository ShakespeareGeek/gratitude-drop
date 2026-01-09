import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.gratitudedrop.com'),
  title: 'The Daily Gratitude Drop',
  description: '3 anonymous thank-you notes. One minute. Zero noise.',
  openGraph: {
    title: 'The Daily Gratitude Drop',
    description: '3 anonymous thank-you notes. One minute. Zero noise.',
    url: 'https://www.gratitudedrop.com',
    siteName: 'Gratitude Drop',
    images: [
      {
        url: 'https://www.gratitudedrop.com/card.png',
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
    description: '3 anonymous thank-you notes. One minute. Zero noise.',
    images: ['https://www.gratitudedrop.com/card.png'],
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
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌅</text></svg>" />
      </head>
      <body className="bg-slate-50 text-slate-800 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}