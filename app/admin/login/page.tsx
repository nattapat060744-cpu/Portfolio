'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    setErr('')
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) {
      setErr('เข้าสู่ระบบไม่สำเร็จ: ' + error.message)
      setBusy(false)
      return
    }
    router.push('/admin')
    router.refresh()
  }

  return (
    <div style={{ maxWidth: 420, margin: '60px auto' }}>
      <h1>เข้าสู่ระบบหลังบ้าน</h1>
      <div className="fld">
        <label>อีเมล</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
      </div>
      <div className="fld">
        <label>รหัสผ่าน</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      {err && <div className="msg err">{err}</div>}
      <button className="btn" onClick={submit} disabled={busy}>{busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button>
    </div>
  )
}
