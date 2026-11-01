'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  normalizeSettings, skillsToText, textToSkills, socialsToText, textToSocials, factsToText, textToFacts,
  timelineToText, textToTimeline, toolsToText, textToTools,
} from '@/lib/utils'

export default function SettingsPage() {
  const sb = useMemo(() => createClient(), [])
  const [f, setF] = useState({
    name: '', tagline: '', bio: '', email: '', status: '', resume_url: '', avatar_url: '',
    skills: '', timeline: '', tools: '', socials: '', facts: '', learning: '', contact_note: '', looking_for: '',
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
        skills: skillsToText(s.skills), socials: socialsToText(s.socials),
        facts: factsToText(s.facts), learning: toolsToText(s.learning), contact_note: s.contact_note, looking_for: toolsToText(s.looking_for),
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
      skills: textToSkills(f.skills),
      socials: textToSocials(f.socials),
      facts: textToFacts(f.facts),
      learning: textToTools(f.learning),
      contact_note: f.contact_note.trim() || null,
      looking_for: textToTools(f.looking_for),
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
        <label>ช่องทางติดต่ออื่นๆ (GitHub, LinkedIn ฯลฯ)</label>
        <textarea style={{ minHeight: 90 }} value={f.socials} onChange={(e) => set('socials', e.target.value)} placeholder={'GitHub|https://github.com/ชื่อผู้ใช้\nLinkedIn|https://www.linkedin.com/in/ชื่อผู้ใช้'} />
        <small>บรรทัดละ 1 ช่องทาง รูปแบบ: ชื่อปุ่ม|ลิงก์ ใช้ได้ทั้ง https://..., mailto:อีเมล และ tel:เบอร์ (เบอร์โทรจะเปิดเผยต่อทุกคนที่เข้าเว็บ ใส่เมื่อมั่นใจเท่านั้น) เช่น LINE ใช้ https://line.me/ti/p/~ไอดีไลน์</small>
      </div>
      <div className="fld">
        <label>กำลังมองหา (ตำแหน่ง / ประเภทงาน / ความพร้อม)</label>
        <input type="text" value={f.looking_for} onChange={(e) => set('looking_for', e.target.value)} placeholder="ฝึกงาน, Web Developer, IT Support, พร้อมเริ่มงานได้ทันที" />
        <small>คั่นด้วยเครื่องหมายจุลภาค (,) แสดงเป็นป้ายในส่วนติดต่อ ให้ผู้อ่านรู้ทันทีว่าติดต่อเรื่องอะไรได้</small>
      </div>
      <div className="fld">
        <label>ข้อความในส่วนติดต่อ</label>
        <input type="text" value={f.contact_note} onChange={(e) => set('contact_note', e.target.value)} placeholder="เช่น สนใจฝึกงานหรือร่วมงาน ติดต่อได้ตามช่องทางนี้ ตอบกลับภายใน 1–2 วัน" />
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
        <label>ข้อมูลโดยย่อ (พื้นที่ สถานะ ภาษา ฯลฯ)</label>
        <textarea style={{ minHeight: 90 }} value={f.facts} onChange={(e) => set('facts', e.target.value)} placeholder={'พื้นที่|กรุงเทพฯ\nสถานะ|กำลังหางานฝึกงาน\nภาษา|ไทย, English'} />
        <small>บรรทัดละ 1 รายการ รูปแบบ: หัวข้อ|ข้อมูล แสดงเป็นป้ายใต้ข้อความแนะนำตัว ใส่แค่ระดับจังหวัดพอ ไม่ต้องใส่ที่อยู่เต็ม</small>
      </div>
      <div className="fld">
        <label>กำลังเรียนรู้ / สนใจต่อยอด</label>
        <input type="text" value={f.learning} onChange={(e) => set('learning', e.target.value)} placeholder="Docker, Next.js App Router, UX Design" />
        <small>คั่นด้วยเครื่องหมายจุลภาค (,) แสดงเป็นกล่องสีเหลือง ช่วยให้ผู้อ่านเห็นว่าคุณพัฒนาตัวเองต่อเนื่อง</small>
      </div>
      <div className="fld">
        <label>ทักษะ (จัดเป็นกลุ่ม)</label>
        <textarea value={f.skills} onChange={(e) => set('skills', e.target.value)} placeholder={'พัฒนาเว็บ|React, Next.js, TypeScript\nงานสร้างสรรค์|กราฟิก, ตัดต่อวิดีโอ'} />
        <small>บรรทัดละ 1 กลุ่ม รูปแบบ: ชื่อกลุ่ม|รายการที่ 1, รายการที่ 2, รายการที่ 3</small>
      </div>
      <div className="fld">
        <label>เครื่องมือ (แถบสีเหลืองที่วิ่งหน้าแรก)</label>
        <input type="text" value={f.tools} onChange={(e) => set('tools', e.target.value)} placeholder="TypeScript, Next.js, Figma" />
        <small>คั่นด้วยเครื่องหมายจุลภาค (,)</small>
      </div>
      <div className="fld">
        <label>การศึกษาและประสบการณ์ (ไทม์ไลน์)</label>
        <textarea style={{ minHeight: 140 }} value={f.timeline} onChange={(e) => set('timeline', e.target.value)} placeholder={'2023 – ปัจจุบัน|ชื่อสถานศึกษา / สาขา|รายละเอียด|การศึกษา\n2025|ชื่อคอร์ส หรือใบรับรอง|ผู้จัด / สิ่งที่ได้เรียน|คอร์ส'} />
        <small>บรรทัดละ 1 รายการ รูปแบบ: ช่วงเวลา|หัวข้อ|รายละเอียด|ประเภท ประเภทคือคำสั้นๆ เช่น การศึกษา, คอร์ส, กิจกรรม, ฝึกงาน (ใส่หรือไม่ใส่ก็ได้) จะขึ้นเป็นป้ายสีพร้อมไอคอน</small>
      </div>

      {msg && <div className={'msg ' + (msg.ok ? 'ok' : 'err')}>{msg.t}</div>}
      <button className="btn" onClick={save} disabled={busy || uploading}>{busy ? 'กำลังบันทึก...' : 'บันทึก'}</button>
    </>
  )
}
