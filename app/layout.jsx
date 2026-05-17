import './globals.css'

export const metadata = {
  title: 'info4info',
  description: 'Intelligent Financial Document Assistant',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ height: '100vh', display: 'flex', overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  )
}
