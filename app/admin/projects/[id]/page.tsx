'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATS, slugify } from '@/lib/utils'
import type { Project } from '@/lib/types'

const empty = {
  title: '', slug: '', category: 'web', description: '', tech: '',
  cover_url: '', youtube_url: '', demo_url: '', github_url: '',
  year: '', role: '', sort_order: '0', is_published: true,
}

export default function ProjectForm({ params }: { params: { id: string } }) {
  const isNew = params.id === 'new'
  const router = useRouter()
  const sb = useMemo(() => createClient(), [])
  const [f, setF] = useState(empty)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)

  const set = (k: keyof typeof empty, v: string | boolean) => setF((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    if (isNew) return
    sb.from('projects').select('*').eq('id', params.id).single().then(({ data, error }) => {
      if (error || !data) return setErr(error?.message ?? 'ไม่พบผลงาน')
      const p = data as Project
      setF({
        title: p.title, slug: p.slug, category: p.category, description: p.description ?? '',
        tech: p.tech.join(', '), cover_url: p.cover_url ?? '', youtube_url: p.youtube_url ?? '',
        demo_url: p.demo_url ?? '', github_url: p.github_url ?? '', year: p.year ? String(p.year) : '',
        role: p.role ?? '', sort_order: String(p.sort_order), is_published: p.is_published,
      })
    })
  }, [isNew, params.id, sb])

  const upload = async (file: File) => {
    setUploading(true)
    setErr('')
    const path = `covers/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`
    const { error } = await sb.storage.from('portfolio').upload(path, file)
    if (error) setErr('อัปโหลดไม่สำเร็จ: ' + error.message)
    else set('cover_url', sb.storage.from('portfolio').getPublicUrl(path).data.publicUrl)
    setUploading(false)
  }

  const save = async () => {
    if (!f.title.trim()) return setErr('กรุณาใส่ชื่อผลงาน')
    setBusy(true)
    setErr('')
    const payload = {
      title: f.title.trim(),
      slug: f.slug.trim() || slugify(f.title),
      category: f.category,
      description: f.description || null,
      tech: f.tech.split(',').map((s) => s.trim()).filter(Boolean),
      cover_url: f.cover_url || null,
      youtube_url: f.youtube_url || null,
      demo_url: f.demo_url || null,
      github_url: f.github_url || null,
      year: f.year ? Number(f.year) : null,
      role: f.role || null,
      sort_order: Number(f.sort_order) || 0,
      is_published: f.is_published,
    }
    const { error } = isNew
      ? await sb.from('projects').insert(payload)
      : await sb.from('projects').update(payload).eq('id', params.id)
    if (error) {
      setErr('บันทึกไม่สำเร็จ: ' + error.message)
      setBusy(false)
      return
    }
    router.push('/admin')
    router.refresh()
  }

  return (
    <>
      <h1>{isNew ? 'เพิ่มผลงานใหม่' : 'แก้ไขผลงาน'}</h1>

      <div className="fld">
        <label>ชื่อผลงาน *</label>
        <input type="text" value={f.title} onChange={(e) => set('title', e.target.value)} />
      </div>

      <div className="g2">
        <div className="fld">
          <label>หมวดหมู่</label>
          <select value={f.category} onChange={(e) => set('category', e.target.value)}>
            {Object.keys(CATS).filter((k) => k !== 'all').map((k) => <option key={k} value={k}>{CATS[k][0]}</option>)}
          </select>
        </div>
        <div className="fld">
          <label>ลำดับการแสดง</label>
          <input type="number" value={f.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
          <small>เลขน้อยแสดงก่อน</small>
        </div>
      </div>

      <div className="fld">
        <label>รายละเอียด</label>
        <textarea value={f.description} onChange={(e) => set('description', e.target.value)} />
      </div>

      <div className="fld">
        <label>เทคโนโลยี / เครื่องมือที่ใช้</label>
        <input type="text" value={f.tech} onChange={(e) => set('tech', e.target.value)} placeholder="Next.js, TypeScript, Supabase" />
        <small>คั่นด้วยเครื่องหมายจุลภาค (,)</small>
      </div>

      <div className="g2">
        <div className="fld">
          <label>ปี</label>
          <input type="number" value={f.year} onChange={(e) => set('year', e.target.value)} placeholder="2026" />
        </div>
        <div className="fld">
          <label>บทบาทของคุณ</label>
          <input type="text" value={f.role} onChange={(e) => set('role', e.target.value)} placeholder="Full-stack" />
        </div>
      </div>

      <div className="fld">
        <label>รูปปก</label>
        <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <small>{uploading ? 'กำลังอัปโหลด...' : 'หรือวางลิงก์รูปด้านล่าง'}</small>
        <input type="url" style={{ marginTop: 8 }} value={f.cover_url} onChange={(e) => set('cover_url', e.target.value)} placeholder="https://..." />
        {f.cover_url && <img src={f.cover_url} alt="" style={{ marginTop: 10, maxWidth: 260, borderRadius: 12, border: '2px solid var(--ink)' }} />}
      </div>

      <div className="fld">
        <label>ลิงก์ YouTube</label>
        <input type="url" value={f.youtube_url} onChange={(e) => set('youtube_url', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
        <small>ใส่แล้วจะฝังวิดีโอในหน้ารายละเอียดอัตโนมัติ</small>
      </div>
      <div className="g2">
        <div className="fld">
          <label>ลิงก์เว็บตัวอย่าง (Demo)</label>
          <input type="url" value={f.demo_url} onChange={(e) => set('demo_url', e.target.value)} />
        </div>
        <div className="fld">
          <label>ลิงก์ GitHub</label>
          <input type="url" value={f.github_url} onChange={(e) => set('github_url', e.target.value)} />
        </div>
      </div>

      <div className="fld">
        <label>Slug (ชื่อสำหรับลิงก์)</label>
        <input type="text" value={f.slug} onChange={(e) => set('slug', e.target.value)} placeholder="เว้นว่างไว้ให้สร้างอัตโนมัติ" />
      </div>

      <div className="fld">
        <label className="chk">
          <input type="checkbox" checked={f.is_published} onChange={(e) => set('is_published', e.target.checked)} />
          แสดงผลงานนี้บนหน้าเว็บ
        </label>
      </div>

      {err && <div className="msg err">{err}</div>}
      <div className="flex gap-3">
        <button className="btn" onClick={save} disabled={busy || uploading}>{busy ? 'กำลังบันทึก...' : 'บันทึก'}</button>
        <Link className="btn alt" href="/admin">ยกเลิก</Link>
      </div>
    </>
  )
}
