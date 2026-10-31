'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CATS } from '@/lib/utils'
import type { Project } from '@/lib/types'

export default function AdminProjects() {
  const sb = useMemo(() => createClient(), [])
  const [items, setItems] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await sb
      .from('projects')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) setErr(error.message)
    setItems((data ?? []) as Project[])
    setLoading(false)
  }, [sb])

  useEffect(() => {
    load()
  }, [load])

  const toggle = async (p: Project) => {
    const { error } = await sb.from('projects').update({ is_published: !p.is_published }).eq('id', p.id)
    if (error) setErr(error.message)
    load()
  }

  const remove = async (p: Project) => {
    if (!confirm(`ลบผลงาน "${p.title}" ใช่ไหม? ลบแล้วกู้คืนไม่ได้`)) return
    const { error } = await sb.from('projects').delete().eq('id', p.id)
    if (error) setErr(error.message)
    load()
  }

  return (
    <>
      <div className="flex gap-3" style={{ alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, marginRight: 'auto' }}>ผลงานทั้งหมด ({items.length})</h1>
        <Link className="btn" href="/admin/projects/new">+ เพิ่มผลงาน</Link>
      </div>
      {err && <div className="msg err">{err}</div>}
      {loading && <p>กำลังโหลด...</p>}
      {!loading && items.length === 0 && <p>ยังไม่มีผลงาน กด "เพิ่มผลงาน" เพื่อเริ่มได้เลย</p>}
      {items.map((p) => (
        <div className="arow" key={p.id}>
          {p.cover_url ? <img src={p.cover_url} alt="" /> : <div style={{ width: 64, height: 44, borderRadius: 8, border: '2px solid var(--ink)', background: `var(${(CATS[p.category] ?? CATS.web)[1]})` }} />}
          <div className="tt">
            {p.title}
            <small>
              {(CATS[p.category] ?? CATS.web)[0]} · ลำดับ {p.sort_order} · {p.is_published ? 'แสดงอยู่' : 'ซ่อนอยู่'}
            </small>
          </div>
          <button className="btn sm alt" onClick={() => toggle(p)}>{p.is_published ? 'ซ่อน' : 'แสดง'}</button>
          <Link className="btn sm" href={`/admin/projects/${p.id}`}>แก้ไข</Link>
          <button className="btn sm danger" onClick={() => remove(p)}>ลบ</button>
        </div>
      ))}
    </>
  )
}
