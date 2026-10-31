'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  normalizeSettings, statsToText, textToStats, skillsToText, textToSkills,
  timelineToText, textToTimeline, toolsToText, textToTools,
} from '@/lib/utils'

export default function SettingsPage() {
  const sb = useMemo(() => createClient(), [])
  const [f, setF] = useState({ name: '', tagline: '', bio: '', email: '', stats: '', skills: '', timeline: '', tools: '' })
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    sb.from('site_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      const s = normalizeSettings(data)
      setF({
        name: data?.name ?? '', tagline: data?.tagline ?? '', bio: s.bio, email: s.email,
        stats: statsToText(s.stats), skills: skillsToText(s.skills),
        timeline: timelineToText(s.timeline), tools: toolsToText(s.tools),
      })
    })
  }, [sb])

  const save = async () => {
    setBusy(true)
    setMsg(null)
    const { error } = await sb.from('site_settings').update({
      name: f.name.trim() || null,
      tagline: f.tagline || null,
      bio: f.bio || null,
      email: f.email.trim() || null,
      stats: textToStats(f.stats),
      skills: textToSkills(f.skills),
      timeline: textToTimeline(f.timeline),
      tools: textToTools(f.tools),
    }).eq('id', 1)
    setMsg(error ? { ok: false, t: 'บันทึกไม่สำเร็จ: ' + error.message } : { ok: true, t: 'บันทึกแล้ว หน้าเว็บจะอัปเดตภายในประมาณ 30 วินาที' })
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
        <textarea value={f.tagline} onChange={(e) => set('tagline', e.target.value)} />
      </div>
      <div className="fld">
        <label>เล่าเรื่องตัวเอง (หน้าเกี่ยวกับ)</label>
        <textarea style={{ minHeight: 160 }} value={f.bio} onChange={(e) => set('bio', e.target.value)} />
      </div>
      <div className="fld">
        <label>ตัวเลขสถิติ</label>
        <textarea value={f.stats} onChange={(e) => set('stats', e.target.value)} placeholder={'40|โปรเจกต์ที่ส่งมอบ\n5|ปีประสบการณ์'} />
        <small>บรรทัดละ 1 รายการ รูปแบบ: ตัวเลข|ข้อความ</small>
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
        <label>ประสบการณ์ (ไทม์ไลน์)</label>
        <textarea style={{ minHeight: 140 }} value={f.timeline} onChange={(e) => set('timeline', e.target.value)} placeholder={'2025 – ปัจจุบัน|Freelance Developer|รายละเอียดงาน'} />
        <small>บรรทัดละ 1 รายการ รูปแบบ: ช่วงเวลา|ตำแหน่ง|รายละเอียด</small>
      </div>

      {msg && <div className={'msg ' + (msg.ok ? 'ok' : 'err')}>{msg.t}</div>}
      <button className="btn" onClick={save} disabled={busy}>{busy ? 'กำลังบันทึก...' : 'บันทึก'}</button>
    </>
  )
}
