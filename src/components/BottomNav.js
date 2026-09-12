'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav({ user }) {
  const pathname = usePathname()

  if (!user) return null

  const items = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/upload', label: 'Upload', icon: '➕' },
    { href: '/wallet', label: 'Wallet', icon: '💰' },
  ]

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--card-bg)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '10px 0',
      maxWidth: '500px',
      margin: '0 auto',
    }}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            color: pathname === item.href ? 'var(--accent)' : 'var(--text-muted)',
            fontWeight: pathname === item.href ? '700' : '400',
          }}
        >
          <span style={{ fontSize: '20px' }}>{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </div>
  )
}