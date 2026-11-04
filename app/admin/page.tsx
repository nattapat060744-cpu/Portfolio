'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CATS, normalizeSettings } from '@/lib/utils'
import { buildSections } from '@/lib/sections'
import type { Project, Settings } from '@/lib/types'

export default function Dashboard() {
  const sb = useMemo(() => createClient(), [])
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [s, setS] = useState<Settings | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    Promise.all([
      sb.from('projects').select('*').order('created_at', { ascending: false }),
      sb.from('site_settings').select('*').eq('id', 1).maybeSingle(),
    ]).then(([p, st]) => {
      if (p.error) setErr(p.error.message)
      if (st.error) setErr(st.error.message)
      setProjects((p.data ?? []) as Project[])
      setS(normalizeSettings(st.data))
    })
  }, [sb])

  if (!projects || !s) return <p>กำลังโหลด...</p>

  const secs = buildSections(s, projects)
  const done = secs.reduce((a, x) => a + x.done, 0)
  const total = secs.reduce((a, x) => a + x.total, 0)
  const pct = total ? Math.round((done / total) * 100) : 0
  const todo = secs.flatMap((x) => x.missing.map((m) => ({ ...m, sec: x.name }))).slice(0, 8)
  const pub = projects.filter((p) => p.is_published)

  return (
    <>
      <div className="ad-head">
        <div style={{ marginRight: 'auto' }}>
          <h1>ภาพรวม</h1>
          <p className="ad-sub">แผนผังหน้าเว็บ ว่าแต่ละส่วนมีข้อมูลอะไร ครบหรือยัง และกดไปแก้ได้เลย</p>
        </div>
        <Link className="btn" href="/admin/projects/new">+ เพิ่มผลงาน</Link>
        <a className="btn alt" href="/" target="_blank" rel="noopener noreferrer">ดูหน้าเว็บ ↗</a>
      </div>

      {err && <div className="msg err">{err}</div>}

      <div className="ad-stats">
        <div className="ad-stat"><b>{projects.length}</b><span>ผลงานทั้งหมด</span></div>
        <div className="ad-stat"><b>{pub.length}</b><span>แสดงบนเว็บ</span></div>
        <div className="ad-stat"><b>{projects.length - pub.length}</b><span>ซ่อนอยู่</span></div>
        <div className="ad-stat"><b>{pct}%</b><span>ความพร้อมของเว็บ ({done}/{total})</span></div>
      </div>

      <h2 style={{ fontSize: 20, margin: '0 0 12px' }}>แผนผังหน้าเว็บ (เรียงตามที่แสดงบนเว็บ)</h2>
      <div className="sec-grid">
        {secs.map((x) => (
          <div className="sec-card" key={x.id}>
            <div className="sec-top">
              <span className="ico">{x.icon}</span>
              <b>{x.name}</b>
              <span className={'pill' + (x.done === x.total ? ' ok' : '')}>{x.done}/{x.total}</span>
            </div>
            <p className="shows">{x.shows}</p>
            <div className="ad-prog sm"><i style={{ width: (x.total ? (x.done / x.total) * 100 : 0) + '%' }} /></div>
            <div className="sec-act">
              <Link className="btn sm" href={x.edit}>แก้ไข</Link>
              {x.anchor !== undefined && <a className="btn sm alt" href={'/' + x.anchor} target="_blank" rel="noopener noreferrer">ดูบนเว็บ ↗</a>}
            </div>
          </div>
        ))}
      </div>

      <div className="ad-two">
        <div className="ad-card">
          <h2>สิ่งที่ควรทำต่อ</h2>
          {todo.length === 0 && <p className="hint" style={{ margin: 0 }}>ครบทุกข้อแล้ว 🎉 พร้อมส่งลิงก์ให้คนอื่นดู</p>}
          {todo.map((c, i) => (
            <Link key={i} href={c.href} className="ad-check">
              <span className="dot todo" />
              <span style={{ flex: 1 }}>
                {c.label}
                <small style={{ display: 'block', color: 'var(--mute)' }}>ส่วน: {c.sec}</small>
              </span>
              <span className="go">ไปแก้ →</span>
            </Link>
          ))}
        </div>

        <div className="ad-card">
          <h2>ผลงานล่าสุด</h2>
          {projects.length === 0 && <p className="hint">ยังไม่มีผลงาน กด "เพิ่มผลงาน" เพื่อเริ่มได้เลย</p>}
          {projects.slice(0, 5).map((p) => (
            <Link key={p.id} href={`/admin/projects/${p.id}`} className="ad-check">
              <span style={{ flex: 1 }}>
                {p.is_featured ? '⭐ ' : ''}{p.title}
                <small style={{ display: 'block', color: 'var(--mute)' }}>
                  {(CATS[p.category] ?? CATS.web)[0]} · {p.is_published ? 'แสดงอยู่' : 'ซ่อนอยู่'}
                </small>
              </span>
              <span className="go">แก้ไข →</span>
            </Link>
          ))}
          {projects.length > 5 && <p style={{ marginBottom: 0 }}><Link href="/admin/projects">ดูผลงานทั้งหมด →</Link></p>}
        </div>
      </div>
    </>
  )
}
