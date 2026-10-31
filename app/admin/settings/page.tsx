'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  normalizeSettings, statsToText, textToStats, skillsToText, textToSkills,
  timelineToText, textToTimeline, toolsToText, textToTools,
} from '@/lib/utils'

export default function SettingsPage() {
  const sb = useMemo(() => createClient(), [])
  const [f, setF] = useState({
    name: '', tagline: '', bio: '', email: '', status: '', resume_url: '', avatar_url: '',
    stats: '', skills: '', timeline: '', tools: '',
  })
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    sb.from('site_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      const s = normalizeSettings(data)
      setF({
        name: data?.name ?? '', tagline: data?.tagline ?? '', bio: s.bio, email: s.email,
        status: data?.status ?? '', resume_url: data?.resume_url ?? '', avatar_url: data?.avatar_url ?? '',
        stats: statsToText(s.stats), skills: skillsToText(s.skills),
        timeline: timelineToText(s.timeline), tools: toolsToText(s.tools),
      })
    })
  }, [sb])

  const uploadResume = async (file: File) => {
    setUploading(true)
    setMsg(null)
    const path = `resume/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`
    const { error } = await sb.storage.from('portfolio').upload(path, file)
    if (error) setMsg({ ok: false, t: 'อัปโหลดไม่สำเร็จ: ' + error.message })
    else set('resume_url', sb.storage.from('portfolio').getPublicUrl(path).data.publicUrl)
    setUploading(false)
  }

  const uploadAvatar = async (file: File) => {
    setUploading(true)
    setMsg(null)
    const path = `avatar/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`
    const { error } = await sb.storage.from('portfolio').upload(path, file)
    if (error) setMsg({ ok: false, t: 'อัปโหลดไม่สำเร็จ: ' + error.message })
    else set('avatar_url', sb.storage.from('portfolio').getPublicUrl(path).data.publicUrl)
    setUploading(false)
  }

  const save = async () => {
    setBusy(true)
    setMsg(null)
    const { error } = await sb.from('site_settings').update({
      name: f.name.trim() || null,
      tagline: f.tagline || null,
      bio: f.bio || null,
      email: f.email.trim() || null,
      status: f.status.trim() || null,
      resume_url: f.resume_url.trim() || null,
      avatar_url: f.avatar_url.trim() || null,
      stats: textToStats(f.stats),
      skills: textToSkills(f.skills),
      timeline: textToTimeline(f.timeline),
      tools: textToTools(f.tools),
    }).eq('id', 1)
    setMsg(error ? { ok: false, t: 'บันทึกไม่สำเร็จ: ' + error.message } : { ok: true, t: 'บันทึกแล้ว' })
    setBusy(false)
  }

  return (
    <>
      <h1>ข้อมูลเว็บ</h1>
      <div className="g2">
        <div className="fld">
          <label>ชื่อของคุณ</label>
          <input type="text" value={f.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="fld">
          <label>อีเมลติดต่อ</label>
          <input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} />
        </div>
      </div>
      <div className="fld">
        <label>ข้อความใต้หัวข้อหน้าแรก</label>
        <textarea value={f.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="เช่น นักศึกษาสายไอที สนใจงานพัฒนาเว็บและระบบ" />
      </div>
      <div className="fld">
        <label>ข้อความในสติกเกอร์วงกลมหน้าแรก</label>
        <input type="text" value={f.status} onChange={(e) => set('status', e.target.value)} placeholder="เปิดรับโอกาส" />
        <small>สั้นๆ ไม่เกิน ~12 ตัวอักษร เช่น "หางานฝึกงาน" หรือ "เปิดรับโอกาส"</small>
      </div>
      <div className="fld">
        <label>รูปโปรไฟล์ของคุณ</label>
        <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
        <small>{uploading ? 'กำลังอัปโหลด...' : 'จะแสดงแทนตัวอักษรในกล่องสีส้มส่วน "เกี่ยวกับฉัน" (ถ้าไม่ใส่ จะโชว์ตัวอักษรแรกของชื่อ) แนะนำรูปแนวตั้งหรือสี่เหลี่ยมจัตุรัส'}</small>
        <input type="url" style={{ marginTop: 8 }} value={f.avatar_url} onChange={(e) => set('avatar_url', e.target.value)} placeholder="https://..." />
        {f.avatar_url && <img src={f.avatar_url} alt="" style={{ marginTop: 10, maxWidth: 160, borderRadius: 12, border: '2px solid var(--ink)' }} />}
      </div>
      <div className="fld">
        <label>ไฟล์เรซูเม่ (ถ้ามี)</label>
        <input type="file" accept=".pdf,application/pdf" onChange={(e) => e.target.files?.[0] && uploadResume(e.target.files[0])} />
        <small>{uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์ PDF หรือวางลิงก์ด้านล่าง ถ้ามีลิงก์จะโชว์ปุ่ม "ดาวน์โหลดเรซูเม่" บนหน้าเว็บ'}</small>
        <input type="url" style={{ marginTop: 8 }} value={f.resume_url} onChange={(e) => set('resume_url', e.target.value)} placeholder="https://..." />
      </div>
      <div className="fld">
        <label>เล่าเรื่องตัวเอง (หน้าเกี่ยวกับ)</label>
        <textarea style={{ minHeight: 160 }} value={f.bio} onChange={(e) => set('bio', e.target.value)} />
      </div>
      <div className="fld">
        <label>ตัวเลขสถิติ</label>
        <textarea value={f.stats} onChange={(e) => set('stats', e.target.value)} placeholder={'10|โปรเจกต์ที่ทำ\n3|ปีที่ฝึกเขียนโค้ด'} />
        <small>บรรทัดละ 1 รายการ รูปแบบ: ตัวเลข|ข้อความ (ลบทั้งหมดได้ถ้าไม่ต้องการแสดง)</small>
      </div>
      <div className="fld">
        <label>ทักษะ</label>
        <textarea value={f.skills} onChange={(e) => set('skills', e.target.value)} placeholder={'Web / Frontend|90\nตัดต่อวิดีโอ|75'} />
        <small>บรรทัดละ 1 รายการ รูปแบบ: ชื่อทักษะ|ระดับ 0-100</small>
      </div>
      <div className="fld">
        <label>เครื่องมือ (แถบวิ่งและกล่องเครื่องมือ)</label>
        <input type="text" value={f.tools} onChange={(e) => set('tools', e.target.value)} placeholder="TypeScript, Next.js, Figma" />
        <small>คั่นด้วยเครื่องหมายจุลภาค (,)</small>
      </div>
      <div className="fld">
        <label>การศึกษาและประสบการณ์ (ไทม์ไลน์)</label>
        <textarea style={{ minHeight: 140 }} value={f.timeline} onChange={(e) => set('timeline', e.target.value)} placeholder={'2023 – ปัจจุบัน|ชื่อสถานศึกษา / สาขา|รายละเอียด'} />
        <small>บรรทัดละ 1 รายการ รูปแบบ: ช่วงเวลา|หัวข้อ|รายละเอียด</small>
      </div>

      {msg && <div className={'msg ' + (msg.ok ? 'ok' : 'err')}>{msg.t}</div>}
      <button className="btn" onClick={save} disabled={busy || uploading}>{busy ? 'กำลังบันทึก...' : 'บันทึก'}</button>
    </>
  )
}
