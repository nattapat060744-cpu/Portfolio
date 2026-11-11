'use client'

/* list of all projects: search, filter, show/hide, reorder, delete */
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CATS, coverSrc } from '@/lib/utils'
import type { Project } from '@/lib/types'

export default function ProjectsPage() {
  const sb = useMemo(() => createClient(), [])
  const [items, setItems] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [st, setSt] = useState('all')

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
    // initial data fetch on mount; state updates happen after the awaited request
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const filtering = q.trim() !== '' || cat !== 'all' || st !== 'all'
  const shown = items.filter(
    (p) =>
      (cat === 'all' || p.category === cat) &&
      (st === 'all' || (st === 'on' ? p.is_published : !p.is_published)) &&
      (!q.trim() || p.title.toLowerCase().includes(q.trim().toLowerCase()))
  )

  const toggle = async (p: Project) => {
    setItems((l) => l.map((x) => (x.id === p.id ? { ...x, is_published: !x.is_published } : x)))
    const { error } = await sb.from('projects').update({ is_published: !p.is_published }).eq('id', p.id)
    if (error) {
      setErr(error.message)
      load()
    }
  }

  const remove = async (p: Project) => {
    if (!confirm(`ลบผลงาน "${p.title}" ใช่ไหม? ลบแล้วกู้คืนไม่ได้`)) return
    const { error } = await sb.from('projects').delete().eq('id', p.id)
    if (error) setErr(error.message)
    load()
  }

  // swap with the neighbour and renumber everything 1..n
  const move = async (idx: number, dir: number) => {
    const j = idx + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    const tmp = next[idx]
    next[idx] = next[j]
    next[j] = tmp
    const renum = next.map((x, i) => ({ ...x, sort_order: i + 1 }))
    const changed = renum.filter((x) => x.sort_order !== items.find((o) => o.id === x.id)?.sort_order)
    setItems(renum)
    const results = await Promise.all(
      changed.map((x) => sb.from('projects').update({ sort_order: x.sort_order }).eq('id', x.id))
    )
    const bad = results.find((r) => r.error)
    if (bad?.error) {
      setErr(bad.error.message)
      load()
    }
  }

  return (
    <>
      <div className="ad-head">
        <div style={{ marginRight: 'auto' }}>
          <h1>ผลงาน ({items.length})</h1>
          <p className="ad-sub">ลำดับในรายการนี้คือลำดับที่แสดงบนหน้าเว็บ ใช้ปุ่ม ▲ ▼ เพื่อเรียงใหม่</p>
        </div>
        <Link className="btn" href="/admin/projects/new">+ เพิ่มผลงาน</Link>
      </div>

      {err && <div className="msg err">{err}</div>}

      <div className="ad-bar">
        <input placeholder="🔍 ค้นหาชื่อผลงาน" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          {Object.keys(CATS).map((k) => <option key={k} value={k}>{k === 'all' ? 'ทุกหมวด' : CATS[k][0]}</option>)}
        </select>
        <select value={st} onChange={(e) => setSt(e.target.value)}>
          <option value="all">ทุกสถานะ</option>
          <option value="on">แสดงอยู่</option>
          <option value="off">ซ่อนอยู่</option>
        </select>
      </div>
      {filtering && items.length > 0 && <p className="hint" style={{ marginTop: -6 }}>กำลังกรองอยู่ จึงปิดปุ่มเรียงลำดับไว้ ล้างตัวกรองเพื่อเรียงลำดับ</p>}

      {loading && <p>กำลังโหลด...</p>}
      {!loading && items.length === 0 && <div className="ad-card"><p style={{ margin: 0 }}>ยังไม่มีผลงาน กด &quot;เพิ่มผลงาน&quot; เพื่อเริ่มได้เลย</p></div>}
      {!loading && items.length > 0 && shown.length === 0 && <p>ไม่พบผลงานที่ตรงกับตัวกรอง</p>}

      {shown.map((p, i) => {
        const img = coverSrc(p)
        return (
          <div className="arow" key={p.id}>
            {!filtering && (
              <div className="ad-mv">
                <button type="button" className="mini" onClick={() => move(i, -1)} disabled={i === 0} aria-label="เลื่อนขึ้น">▲</button>
                <button type="button" className="mini" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="เลื่อนลง">▼</button>
              </div>
            )}
            {img
              ? <img src={img} alt="" />
              : <div style={{ width: 64, height: 44, borderRadius: 8, border: '2px solid var(--ink)', background: `var(${(CATS[p.category] ?? CATS.web)[1]})` }} />}
            <div className="tt">
              {p.title}
              <small>{(CATS[p.category] ?? CATS.web)[0]} · {p.year ?? 'ไม่ระบุปี'}</small>
            </div>
            <label className="tgl">
              <input type="checkbox" checked={p.is_published} onChange={() => toggle(p)} />
              <span className="tr" />
              <span>{p.is_published ? 'แสดง' : 'ซ่อน'}</span>
            </label>
            <Link className="btn sm" href={`/admin/projects/${p.id}`}>แก้ไข</Link>
            <button type="button" className="btn sm danger" onClick={() => remove(p)}>ลบ</button>
          </div>
        )
      })}
    </>
  )
}
