'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATS, coverSrc, slugify } from '@/lib/utils'
import type { Project } from '@/lib/types'
import { Card, Field, GalleryUploader, SaveBar, TagInput, Toggle, Uploader } from '@/components/admin/ui'

type Form = {
  title: string; slug: string; category: string
  description: string; goal: string; contribution: string; outcome: string
  tech: string[]; gallery: string[]
  cover_url: string; youtube_url: string; demo_url: string; github_url: string
  year: string; role: string; status: string; team: string; sort_order: string
  is_published: boolean; is_featured: boolean
}

const empty: Form = {
  title: '', slug: '', category: 'web',
  description: '', goal: '', contribution: '', outcome: '',
  tech: [], gallery: [],
  cover_url: '', youtube_url: '', demo_url: '', github_url: '',
  year: '', role: '', status: '', team: '', sort_order: '0',
  is_published: true, is_featured: false,
}

const STATUS = ['เสร็จสมบูรณ์', 'กำลังพัฒนา', 'ต้นแบบ / ทดลอง']
const TEAM = ['ทำคนเดียว', 'ทำเป็นทีม']
const CARD = { label: 'การ์ดผลงานในหน้าแรก' }
const DETAIL = { label: 'หน้ารายละเอียด (กดการ์ดแล้วเปิด)' }

const isUrl = (v: string) => !v || /^https?:\/\//i.test(v)

export default function ProjectForm({ params }: { params: { id: string } }) {
  const isNew = params.id === 'new'
  const router = useRouter()
  const sb = useMemo(() => createClient(), [])
  const [f, setF] = useState<Form>(empty)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((p) => ({ ...p, [k]: v }))
    setDirty(true)
  }

  useEffect(() => {
    if (isNew) return
    sb.from('projects').select('*').eq('id', params.id).single().then(({ data, error }) => {
      if (error || !data) return setErr(error?.message ?? 'ไม่พบผลงาน')
      const p = data as Project
      setF({
        title: p.title, slug: p.slug, category: p.category,
        description: p.description ?? '', goal: p.goal ?? '', contribution: p.contribution ?? '', outcome: p.outcome ?? '',
        tech: p.tech ?? [], gallery: p.gallery ?? [],
        cover_url: p.cover_url ?? '', youtube_url: p.youtube_url ?? '', demo_url: p.demo_url ?? '', github_url: p.github_url ?? '',
        year: p.year ? String(p.year) : '', role: p.role ?? '', status: p.status ?? '', team: p.team ?? '',
        sort_order: String(p.sort_order),
        is_published: p.is_published, is_featured: !!p.is_featured,
      })
    })
  }, [isNew, params.id, sb])

  // warn before closing the tab with unsaved changes
  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const save = async () => {
    if (!f.title.trim()) return setErr('กรุณาใส่ชื่อผลงาน')
    if (!isUrl(f.youtube_url) || !isUrl(f.demo_url) || !isUrl(f.github_url) || !isUrl(f.cover_url)) {
      return setErr('ลิงก์ต้องขึ้นต้นด้วย https:// หรือ http://')
    }
    setBusy(true)
    setErr('')
    const payload = {
      title: f.title.trim(),
      slug: f.slug.trim() || slugify(f.title),
      category: f.category,
      description: f.description.trim() || null,
      goal: f.goal.trim() || null,
      contribution: f.contribution.trim() || null,
      outcome: f.outcome.trim() || null,
      tech: f.tech,
      gallery: f.gallery,
      cover_url: f.cover_url || null,
      youtube_url: f.youtube_url.trim() || null,
      demo_url: f.demo_url.trim() || null,
      github_url: f.github_url.trim() || null,
      year: f.year ? Number(f.year) : null,
      role: f.role.trim() || null,
      status: f.status || null,
      team: f.team || null,
      sort_order: Number(f.sort_order) || 0,
      is_published: f.is_published,
      is_featured: f.is_featured,
    }
    const { error } = isNew
      ? await sb.from('projects').insert(payload)
      : await sb.from('projects').update(payload).eq('id', params.id)
    if (error) {
      setErr(
        error.message.includes('duplicate key')
          ? 'ชื่อลิงก์ (Slug) ซ้ำกับผลงานอื่น ลองแก้ในช่อง "ขั้นสูง" หรือเปลี่ยนชื่อผลงาน'
          : 'บันทึกไม่สำเร็จ: ' + error.message
      )
      setBusy(false)
      return
    }
    setDirty(false)
    router.push('/admin/projects')
    router.refresh()
  }

  const remove = async () => {
    if (!confirm(`ลบผลงาน "${f.title}" ใช่ไหม? ลบแล้วกู้คืนไม่ได้`)) return
    const { error } = await sb.from('projects').delete().eq('id', params.id)
    if (error) return setErr(error.message)
    setDirty(false)
    router.push('/admin/projects')
    router.refresh()
  }

  const img = coverSrc({ cover_url: f.cover_url || null, youtube_url: f.youtube_url || null, demo_url: f.demo_url || null })
  const meta = CATS[f.category] ?? CATS.web
  const desc = f.description.trim()

  return (
    <>
      <div className="ad-head">
        <div style={{ marginRight: 'auto' }}>
          <h1>{isNew ? 'เพิ่มผลงานใหม่' : 'แก้ไขผลงาน'}</h1>
          <p className="ad-sub">แต่ละการ์ดบอกว่าข้อมูลไปแสดงที่ไหน ช่องที่มีดาว ★ ต้องกรอก ที่เหลือใส่ให้ครบจะทำให้ผลงานน่าสนใจขึ้น</p>
        </div>
        <Link className="btn alt" href="/admin/projects">← กลับรายการ</Link>
      </div>

      {err && <div className="msg err" role="alert">{err}</div>}

      <div className="ad-grid">
        <div>
          <Card title="ข้อมูลหลัก" where={CARD} hint="ชื่อและคำอธิบายแสดงบนการ์ด และในหน้ารายละเอียด">
            <Field label="ชื่อผลงาน ★" kind="text">
              <input type="text" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="เช่น ระบบจัดการสต็อกร้านค้า" />
            </Field>
            <Field label="คำอธิบายสั้นๆ" kind="text" hint="การ์ดแสดงประมาณ 70 ตัวอักษรแรก หน้ารายละเอียดแสดงทั้งหมด">
              <textarea value={f.description} onChange={(e) => set('description', e.target.value)} />
            </Field>
          </Card>

          <Card title="เรื่องราวของผลงาน" where={DETAIL} hint="ส่วนที่คนคัดเลือกอยากรู้มากที่สุด ถ้าเว้นว่าง หัวข้อนั้นจะไม่แสดงบนเว็บ">
            <Field label="🎯 ทำเพื่ออะไร (วัตถุประสงค์ / ปัญหาที่แก้)" kind="text">
              <textarea value={f.goal} onChange={(e) => set('goal', e.target.value)} />
            </Field>
            <Field label="🛠 ส่วนที่คุณทำเอง" kind="text" hint="ถ้าทำเป็นทีม ระบุให้ชัดว่าส่วนไหนเป็นของคุณ">
              <textarea value={f.contribution} onChange={(e) => set('contribution', e.target.value)} />
            </Field>
            <Field label="✅ ผลลัพธ์ / สิ่งที่ได้เรียนรู้" kind="text">
              <textarea value={f.outcome} onChange={(e) => set('outcome', e.target.value)} />
            </Field>
          </Card>

          <Card title="แกลเลอรีภาพ" where={DETAIL} hint="ภาพหน้าจอหรือผลงานเพิ่มเติมหลายรูป แสดงเป็นแถวภาพเล็กในหน้ารายละเอียด กดดูภาพใหญ่ได้">
            <GalleryUploader value={f.gallery} onChange={(v) => set('gallery', v)} />
          </Card>

          <Card title="ลิงก์" where={DETAIL} hint="แสดงเป็นปุ่มในหน้ารายละเอียด ลิงก์ต้องขึ้นต้นด้วย https://">
            <Field label="ลิงก์ YouTube" kind="link" hint="ใส่แล้วจะฝังวิดีโอในหน้ารายละเอียดให้อัตโนมัติ">
              <input type="url" value={f.youtube_url} onChange={(e) => set('youtube_url', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
            </Field>
            <div className="g2">
              <Field label="ลิงก์เว็บตัวอย่าง (Demo)" kind="link">
                <input type="url" value={f.demo_url} onChange={(e) => set('demo_url', e.target.value)} />
              </Field>
              <Field label="ลิงก์ GitHub" kind="link">
                <input type="url" value={f.github_url} onChange={(e) => set('github_url', e.target.value)} />
              </Field>
            </div>
          </Card>
        </div>

        <div>
          <Card title="ตัวอย่างการ์ดบนเว็บ" hint="อัปเดตตามที่พิมพ์">
            <div className="card prev-card">
              {img
                ? <div className="cover" style={{ background: `var(${meta[1]})` }}><img src={img} alt="" style={{ objectPosition: 'top' }} /></div>
                : <div className="cover" style={{ background: `var(${meta[1]})`, fontSize: 40 }}>🖼</div>}
              <div className="cbody">
                <span className="cat" style={{ background: `var(${meta[1]})` }}>{meta[0]}</span>
                {f.is_featured && <span className="cat feat">⭐ เด่น</span>}
                <h3>{f.title.trim() || 'ชื่อผลงาน'}</h3>
                <p>{desc ? (desc.length > 70 ? desc.slice(0, 70) + '…' : desc) : 'คำอธิบายสั้นๆ จะขึ้นตรงนี้'}</p>
              </div>
            </div>
          </Card>

          <Card title="การเผยแพร่" where={CARD}>
            <div style={{ display: 'grid', gap: 14 }}>
              <Toggle checked={f.is_published} onChange={(v) => set('is_published', v)} label={f.is_published ? 'แสดงบนหน้าเว็บ' : 'ซ่อนอยู่ (ฉบับร่าง)'} />
              <Toggle checked={f.is_featured} onChange={(v) => set('is_featured', v)} label="⭐ ผลงานเด่น (ขึ้นป้ายบนการ์ด)" />
            </div>
          </Card>

          <Card title="หมวดและรายละเอียด" where={DETAIL}>
            <Field label="หมวดหมู่" kind="choice" hint="ใช้ในตัวกรองหน้าแรกและสีของการ์ด">
              <select value={f.category} onChange={(e) => set('category', e.target.value)}>
                {Object.keys(CATS).filter((k) => k !== 'all').map((k) => <option key={k} value={k}>{CATS[k][0]}</option>)}
              </select>
            </Field>
            <div className="g2">
              <Field label="ปี" kind="number">
                <input type="number" value={f.year} onChange={(e) => set('year', e.target.value)} placeholder="2026" />
              </Field>
              <Field label="บทบาทของคุณ" kind="text">
                <input type="text" value={f.role} onChange={(e) => set('role', e.target.value)} placeholder="Full-stack" />
              </Field>
            </div>
            <div className="g2">
              <Field label="สถานะผลงาน" kind="choice">
                <select value={f.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="">ไม่ระบุ</option>
                  {STATUS.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="รูปแบบการทำงาน" kind="choice">
                <select value={f.team} onChange={(e) => set('team', e.target.value)}>
                  <option value="">ไม่ระบุ</option>
                  {TEAM.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </Field>
            </div>
          </Card>

          <Card title="เทคโนโลยีที่ใช้" where={DETAIL} hint="พิมพ์แล้วกด Enter หรือจุลภาค (,) เพื่อเพิ่ม ใช้ค้นหาผลงานบนหน้าแรกได้ด้วย">
            <Field label="รายการ" kind="list">
              <TagInput value={f.tech} onChange={(v) => set('tech', v)} placeholder="เช่น Next.js, Supabase" />
            </Field>
          </Card>

          <Card title="รูปปก" where={CARD} hint="ถ้าไม่ใส่รูป ระบบจะใช้ภาพหน้าเว็บจากลิงก์ Demo (หรือภาพปก YouTube) ให้อัตโนมัติ">
            <Field label="รูปปก" kind="image">
              <Uploader value={f.cover_url} onChange={(v) => set('cover_url', v)} folder="covers" accept="image/*" />
            </Field>
          </Card>

          <Card title="ขั้นสูง">
            <Field label="Slug (ชื่อสำหรับลิงก์)" kind="text" hint="เว้นว่างไว้ให้สร้างอัตโนมัติจากชื่อผลงาน">
              <input type="text" value={f.slug} onChange={(e) => set('slug', e.target.value)} />
            </Field>
            <Field label="ลำดับการแสดง" kind="number" hint="ปกติเรียงจากหน้ารายการผลงานด้วยปุ่ม ▲ ▼ ได้เลย">
              <input type="number" value={f.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
            </Field>
          </Card>
        </div>
      </div>

      <SaveBar
        onSave={save}
        busy={busy}
        status={dirty ? '● มีการเปลี่ยนแปลงที่ยังไม่บันทึก' : isNew ? 'ผลงานใหม่' : 'ข้อมูลล่าสุดแล้ว'}
      >
        {!isNew && <button type="button" className="btn danger" onClick={remove}>ลบผลงาน</button>}
      </SaveBar>
    </>
  )
}
