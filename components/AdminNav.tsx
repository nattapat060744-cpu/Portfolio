'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminNav() {
  const path = usePathname()
  const router = useRouter()
  if (path === '/admin/login') return null

  const logout = async () => {
    await createClient().auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div className="adm-nav">
      <b>หลังบ้าน</b>
      <Link className="btn sm alt" href="/admin">ผลงาน</Link>
      <Link className="btn sm alt" href="/admin/settings">ข้อมูลเว็บ</Link>
      <a className="btn sm alt" href="/" target="_blank" rel="noopener noreferrer">ดูหน้าเว็บ ↗</a>
      <button className="btn sm danger" onClick={logout}>ออกจากระบบ</button>
    </div>
  )
}
