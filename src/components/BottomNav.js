'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PlusSquare, Wallet } from 'lucide-react'

export default function BottomNav({ user }) {
  const pathname = usePathname()

  if (!user) return null

  const items = [
    { href: '/', label: 'Home', Icon: Home },
    { href: '/upload', label: 'Upload', Icon: PlusSquare },
    { href: '/wallet', label: 'Wallet', Icon: Wallet },
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
      {items.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            fontSize: '11px',
            color: pathname === href ? 'var(--accent)' : 'var(--text-muted)',
            fontWeight: pathname === href ? '700' : '400',
          }}
        >
          <Icon size={22} strokeWidth={pathname === href ? 2.5 : 2} />
          {label}
        </Link>
      ))}
    </div>
  )
}