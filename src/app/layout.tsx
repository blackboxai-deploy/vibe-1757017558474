import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RadiologyAI - Medical Imaging Diagnostic Platform',
  description: 'Advanced medical imaging analysis powered by AI. Upload DICOM files for comprehensive diagnostic reporting.',
  keywords: 'radiology, medical imaging, DICOM, AI diagnosis, medical analysis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}