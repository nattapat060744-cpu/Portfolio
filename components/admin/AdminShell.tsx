'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

const MENU = [
  { href: '/admin', label: 'ภาพรวม', icon: '🏠', exact: true },
  { href: '/admin/projects', label: 'ผลงาน', icon: '🗂', exact: false },
  { href: '/admin/settings', label: 'ข้อมูลเว็บ', icon: '⚙️', exact: false },
]

export default function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname() ?? ''
  const router = useRouter()

  if (path === '/admin/login') return <div className="adm">{children}</div>

  const logout = async () => {
    await createClient().auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div className="ad">
      <aside className="ad-side">
        <div className="ad-brand"><i /> หลังบ้าน</div>
        {MENU.map((m) => {
          const on = m.exact ? path === m.href : path.startsWith(m.href)
          return (
            <Link key={m.href} href={m.href} className={'ad-link' + (on ? ' on' : '')}>
              <span>{m.icon}</span>{m.label}
            </Link>
          )
        })}
        <a className="ad-link" href="/" target="_blank" rel="noopener noreferrer"><span>↗</span>ดูหน้าเว็บ</a>
        <div className="sp" />
        <button type="button" className="ad-link" onClick={logout}><span>🚪</span>ออกจากระบบ</button>
      </aside>
      <main className="ad-main">{children}</main>
    </div>
  )
}
