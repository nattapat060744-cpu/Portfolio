'use client'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// turn Supabase error messages into friendly Thai
function friendly(msg: string) {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials'))
    return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง ลองกดรูปตาเพื่อเช็กรหัสผ่าน และตรวจว่าพิมพ์อีเมลครบทุกตัวอักษร'
  if (m.includes('email not confirmed'))
    return 'อีเมลนี้ยังไม่ได้ยืนยัน ไปที่ Supabase → Authentication → Users แล้วยืนยันผู้ใช้'
  if (m.includes('failed to fetch') || m.includes('network'))
    return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองอีกครั้ง'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'ลองหลายครั้งเกินไป รอสักครู่แล้วลองใหม่'
  return msg
}

const EyeOpen = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOff = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [caps, setCaps] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  // restore the remembered e-mail (never the password)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('adm_email')
      // client-only read of localStorage; must run after mount to avoid hydration mismatch
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setEmail(saved)
    } catch {}
  }, [])

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!email.trim() || !password) {
      setErr('กรุณากรอกอีเมลและรหัสผ่านให้ครบ')
      return
    }
    setBusy(true)
    setErr('')
    const clean = email.trim().toLowerCase()
    const { error } = await createClient().auth.signInWithPassword({ email: clean, password })
    if (error) {
      setErr(friendly(error.message))
      setBusy(false)
      return
    }
    try {
      if (remember) localStorage.setItem('adm_email', clean)
      else localStorage.removeItem('adm_email')
    } catch {}
    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="login-card">
      <div className="login-ico">🔐</div>
      <h1>เข้าสู่ระบบหลังบ้าน</h1>
      <p className="login-sub">สำหรับเจ้าของเว็บเท่านั้น</p>

      <form onSubmit={submit} noValidate>
        <div className="fld">
          <label htmlFor="em">อีเมล</label>
          <input
            id="em"
            type="email"
            inputMode="email"
            autoFocus
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="fld">
          <label htmlFor="pw">รหัสผ่าน</label>
          <div className="pw">
            <input
              id="pw"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="รหัสผ่านของคุณ"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={(e) => setCaps(e.getModifierState('CapsLock'))}
            />
            <button
              type="button"
              className="eye"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              aria-pressed={show}
              title={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            >
              {show ? <EyeOff /> : <EyeOpen />}
            </button>
          </div>
          {caps && <small className="warn">⚠ Caps Lock เปิดอยู่</small>}
        </div>

        <label className="chk" style={{ marginBottom: 16 }}>
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          จำอีเมลนี้ไว้ในเครื่องนี้
        </label>

        {err && <div className="msg err" role="alert">{err}</div>}

        <button className="btn" style={{ width: '100%' }} type="submit" disabled={busy}>
          {busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>

      <p className="login-foot">
        <Link href="/">← กลับหน้าเว็บ</Link>
      </p>
    </div>
  )
}
