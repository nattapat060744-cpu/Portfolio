'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_TAGLINE, normalizeSettings } from '@/lib/utils'
import { buildSections } from '@/lib/sections'
import type { Settings } from '@/lib/types'
import { Card, Field, ListEditor, SaveBar, TagInput, Uploader } from '@/components/admin/ui'

type Form = {
  name: string; tagline: string; bio: string; email: string; status: string
  resume_url: string; avatar_url: string; contact_note: string
  looking_for: string[]; learning: string[]; tools: string[]; hero_words: string[]; interests: string[]
  facts: { label: string; value: string }[]
  skills: { name: string; items: string[] }[]
  timeline: { period: string; title: string; detail: string; tag: string }[]
  socials: { label: string; url: string }[]
  certificates: { title: string; issuer: string; year: string; url: string }[]
  seo_title: string; seo_description: string
}

const blank: Form = {
  name: '', tagline: '', bio: '', email: '', status: '',
  resume_url: '', avatar_url: '', contact_note: '',
  looking_for: [], learning: [], tools: [], hero_words: [], interests: [],
  facts: [], skills: [], timeline: [], socials: [], certificates: [],
  seo_title: '', seo_description: '',
}

// each tab = one part of the public site (ids match lib/sections.ts)
const TABS = [
  { id: 'home', icon: '🏠', label: 'หน้าแรก' },
  { id: 'about', icon: '✨', label: 'เกี่ยวกับฉัน' },
  { id: 'path', icon: '🎓', label: 'การศึกษา / ประสบการณ์' },
  { id: 'certs', icon: '🏅', label: 'ใบรับรอง / รางวัล' },
  { id: 'contact', icon: '📬', label: 'ติดต่อ' },
  { id: 'share', icon: '🔗', label: 'ตอนแชร์ลิงก์' },
]

const W = {
  home: { label: 'หน้าแรก', anchor: '' },
  about: { label: 'เกี่ยวกับฉัน', anchor: '#about' },
  path: { label: 'การศึกษา / ประสบการณ์', anchor: '#path' },
  certs: { label: 'ใบรับรอง / รางวัล', anchor: '#certs' },
  contact: { label: 'ติดต่อ', anchor: '#hire' },
  share: { label: 'ตอนแชร์ลิงก์ (LINE / Facebook / Google)' },
}

const TAGS = ['การศึกษา', 'คอร์ส / ใบรับรอง', 'กิจกรรม / รางวัล', 'ฝึกงาน', 'งาน']

export default function SettingsPage() {
  const sb = useMemo(() => createClient(), [])
  const [f, setF] = useState<Form>(blank)
  const [tab, setTab] = useState('home')
  const [loaded, setLoaded] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [host, setHost] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)

  const upd = (patch: Partial<Form>) => {
    setF((p) => ({ ...p, ...patch }))
    setDirty(true)
    setMsg(null)
  }

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab')
    if (t && TABS.some((x) => x.id === t)) setTab(t)
    setHost(window.location.host)
  }, [])

  useEffect(() => {
    sb.from('site_settings').select('*').eq('id', 1).maybeSingle().then(({ data, error }) => {
      if (error) setMsg({ ok: false, t: 'โหลดข้อมูลไม่สำเร็จ: ' + error.message })
      const n = normalizeSettings(data)
      setF({
        name: data?.name ?? '', tagline: data?.tagline ?? '', bio: n.bio, email: n.email,
        status: data?.status ?? '', resume_url: n.resume_url, avatar_url: n.avatar_url, contact_note: n.contact_note,
        looking_for: n.looking_for, learning: n.learning, tools: n.tools, hero_words: n.hero_words, interests: n.interests,
        facts: n.facts, skills: n.skills, timeline: n.timeline, socials: n.socials, certificates: n.certificates,
        seo_title: n.seo_title, seo_description: n.seo_description,
      })
      setLoaded(true)
    })
  }, [sb])

  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  // completeness badge on each tab, computed from what is typed right now
  const asSettings: Settings = { ...f, stats: [], name: f.name || 'ชื่อคุณ', tagline: f.tagline || DEFAULT_TAGLINE, status: f.status || 'เปิดรับโอกาส' }
  const prog = Object.fromEntries(buildSections(asSettings, []).map((x) => [x.id, x]))

  const save = async () => {
    if (f.socials.some((x) => x.url.trim() && !/^(https?:\/\/|mailto:|tel:)/i.test(x.url.trim()))) {
      return setMsg({ ok: false, t: 'ช่องทางติดต่อ: ลิงก์ต้องขึ้นต้นด้วย https://, mailto: หรือ tel:' })
    }
    if (f.certificates.some((x) => x.url.trim() && !/^https?:\/\//i.test(x.url.trim()))) {
      return setMsg({ ok: false, t: 'ใบรับรอง: ลิงก์ต้องขึ้นต้นด้วย https://' })
    }
    setBusy(true)
    setMsg(null)
    const payload = {
      id: 1,
      name: f.name.trim() || null,
      tagline: f.tagline.trim() || null,
      bio: f.bio.trim() || null,
      email: f.email.trim() || null,
      status: f.status.trim() || null,
      resume_url: f.resume_url.trim() || null,
      avatar_url: f.avatar_url.trim() || null,
      contact_note: f.contact_note.trim() || null,
      looking_for: f.looking_for,
      learning: f.learning,
      tools: f.tools,
      hero_words: f.hero_words,
      interests: f.interests,
      facts: f.facts.filter((x) => x.label.trim() && x.value.trim()),
      skills: f.skills.filter((x) => x.name.trim()),
      timeline: f.timeline.filter((x) => x.period.trim() && x.title.trim()),
      socials: f.socials.filter((x) => x.label.trim() && x.url.trim()).map((x) => ({ label: x.label.trim(), url: x.url.trim() })),
      certificates: f.certificates.filter((x) => x.title.trim()),
      seo_title: f.seo_title.trim() || null,
      seo_description: f.seo_description.trim() || null,
    }
    const { data, error } = await sb.from('site_settings').upsert(payload).select()
    if (error) setMsg({ ok: false, t: 'บันทึกไม่สำเร็จ: ' + error.message })
    else if (!data || data.length === 0) setMsg({ ok: false, t: 'บันทึกไม่เข้า: ไม่มีสิทธิ์แก้ข้อมูล ตรวจอีเมลใน policy ของฐานข้อมูล' })
    else {
      setMsg({ ok: true, t: '✓ บันทึกแล้ว' })
      setDirty(false)
    }
    setBusy(false)
  }

  const cur = TABS.find((t) => t.id === tab)

  return (
    <>
      <div className="ad-head">
        <div style={{ marginRight: 'auto' }}>
          <h1>ข้อมูลเว็บ</h1>
          <p className="ad-sub">แบ่งตามส่วนของหน้าเว็บ แต่ละการ์ดบอกว่าข้อมูลไปแสดงที่ไหน แต่ละช่องมีป้ายบอกประเภทข้อมูล แก้เสร็จกดบันทึกที่แถบด้านล่างครั้งเดียว</p>
        </div>
        <a className="btn alt" href="/" target="_blank" rel="noopener noreferrer">ดูหน้าเว็บ ↗</a>
      </div>

      <div className="ad-tabs">
        {TABS.map((t) => {
          const p = prog[t.id]
          return (
            <button key={t.id} type="button" className={'ad-tab' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
              {p && <span className={'pill' + (p.done === p.total ? ' ok' : '')}>{p.done}/{p.total}</span>}
            </button>
          )
        })}
      </div>

      {tab === 'home' && (
        <>
          <Card title="ข้อมูลหลัก" where={W.home} hint="ชื่อแสดงที่โลโก้มุมซ้ายบน ป้ายต้อนรับ และท้ายเว็บ">
            <div className="g2">
              <Field label="ชื่อของคุณ" kind="text">
                <input type="text" value={f.name} onChange={(e) => upd({ name: e.target.value })} />
              </Field>
              <Field label="ข้อความในสติกเกอร์วงกลม" kind="text" hint="สั้นๆ ไม่เกิน ~12 ตัวอักษร เช่น เปิดรับโอกาส">
                <input type="text" value={f.status} onChange={(e) => upd({ status: e.target.value })} placeholder="เปิดรับโอกาส" />
              </Field>
            </div>
            <Field label="ข้อความใต้หัวข้อใหญ่" kind="text" hint="แนะนำตัวสั้นๆ 1–2 บรรทัด เช่น ตำแหน่งหรือสาขาที่สนใจ">
              <textarea value={f.tagline} onChange={(e) => upd({ tagline: e.target.value })} placeholder="เช่น นักศึกษาสายไอที สนใจงานพัฒนาเว็บและระบบ" />
            </Field>
          </Card>
          <Card title="คำที่สลับในหัวข้อ" where={W.home} hint='หัวข้อใหญ่อ่านว่า "ชอบสร้าง[คำ]และลงมือทำจริง" คำในกรอบสีจะสลับไปมา เว้นว่างไว้จะใช้ค่าเริ่มต้น (เว็บ, แอป, ระบบ, กราฟิก, วิดีโอ)'>
            <Field label="รายการคำ" kind="list">
              <TagInput value={f.hero_words} onChange={(v) => upd({ hero_words: v })} placeholder="เช่น เว็บ, แอป, ระบบ" />
            </Field>
          </Card>
          <Card title="เรซูเม่" where={W.home} hint="อัปโหลด PDF จะมีปุ่ม ดาวน์โหลดเรซูเม่ ที่หน้าแรกและส่วนติดต่อ">
            <Field label="ไฟล์เรซูเม่" kind="file">
              <Uploader value={f.resume_url} onChange={(v) => upd({ resume_url: v })} folder="resume" accept=".pdf,application/pdf" preview={false} />
            </Field>
          </Card>
          <Card title="เครื่องมือที่ใช้" where={W.home} hint="แสดงในแถบสีเหลืองที่วิ่งอยู่ใต้หัวข้อหน้าแรก">
            <Field label="รายการเครื่องมือ" kind="list">
              <TagInput value={f.tools} onChange={(v) => upd({ tools: v })} placeholder="เช่น TypeScript, Figma" />
            </Field>
          </Card>
        </>
      )}

      {tab === 'about' && (
        <>
          <Card title="รูปโปรไฟล์" where={W.about} hint="แสดงในกล่องสีส้ม และเป็นรูปตัวอย่างตอนส่งลิงก์ใน LINE / Facebook แนะนำรูปแนวตั้งหรือจัตุรัส">
            <Field label="รูปโปรไฟล์" kind="image">
              <Uploader value={f.avatar_url} onChange={(v) => upd({ avatar_url: v })} folder="avatar" accept="image/*" />
            </Field>
          </Card>
          <Card title="เล่าเรื่องตัวเอง" where={W.about}>
            <Field label="ข้อความแนะนำตัว" kind="text">
              <textarea className="big" value={f.bio} onChange={(e) => upd({ bio: e.target.value })} />
            </Field>
          </Card>
          <Card title="ข้อมูลโดยย่อ" where={W.about} hint="แสดงเป็นป้ายใต้ข้อความแนะนำตัว ใส่แค่ระดับจังหวัดพอ ไม่ต้องใส่ที่อยู่เต็ม">
            <ListEditor
              items={f.facts}
              onChange={(v) => upd({ facts: v })}
              blank={{ label: '', value: '' }}
              addLabel="เพิ่มข้อมูล"
              render={(it, u) => (
                <div className="g2">
                  <Field label="หัวข้อ" kind="text">
                    <input type="text" value={it.label} onChange={(e) => u({ label: e.target.value })} placeholder="พื้นที่ / สถานะ / ภาษา" />
                  </Field>
                  <Field label="ข้อมูล" kind="text">
                    <input type="text" value={it.value} onChange={(e) => u({ value: e.target.value })} placeholder="กรุงเทพฯ" />
                  </Field>
                </div>
              )}
            />
          </Card>
          <Card title="ทักษะ (จัดเป็นกลุ่ม)" where={W.about} hint="เช่น กลุ่ม พัฒนาเว็บ ที่มีรายการ React, Next.js">
            <ListEditor
              items={f.skills}
              onChange={(v) => upd({ skills: v })}
              blank={{ name: '', items: [] as string[] }}
              addLabel="เพิ่มกลุ่มทักษะ"
              render={(it, u) => (
                <>
                  <Field label="ชื่อกลุ่ม" kind="text">
                    <input type="text" value={it.name} onChange={(e) => u({ name: e.target.value })} placeholder="พัฒนาเว็บและแอป" />
                  </Field>
                  <Field label="รายการ" kind="list" hint="พิมพ์แล้วกด Enter หรือจุลภาค (,)">
                    <TagInput value={it.items} onChange={(v) => u({ items: v })} placeholder="React, Next.js, TypeScript" />
                  </Field>
                </>
              )}
            />
          </Card>
          <Card title="สิ่งที่สนใจ / งานอดิเรก" where={W.about} hint="ช่วยให้คนอ่านเห็นความเป็นตัวคุณ เช่น ถ่ายภาพ เล่นเกม ทำอาหาร">
            <Field label="รายการ" kind="list">
              <TagInput value={f.interests} onChange={(v) => upd({ interests: v })} placeholder="เช่น ถ่ายภาพ, ออกแบบ, เกม" />
            </Field>
          </Card>
          <Card title="กำลังเรียนรู้ / สนใจต่อยอด" where={W.about} hint="แสดงเป็นกล่องสีเหลือง ช่วยให้ผู้อ่านเห็นว่าคุณพัฒนาตัวเองต่อเนื่อง">
            <Field label="รายการ" kind="list">
              <TagInput value={f.learning} onChange={(v) => upd({ learning: v })} placeholder="เช่น Docker, UX Design" />
            </Field>
          </Card>
        </>
      )}

      {tab === 'path' && (
        <Card title="การศึกษาและประสบการณ์" where={W.path} hint="ใส่การศึกษา คอร์ส กิจกรรม และงานที่เคยทำ แสดงเรียงตามลำดับในรายการนี้ ใช้ปุ่ม ▲ ▼ เรียงใหม่">
          <ListEditor
            items={f.timeline}
            onChange={(v) => upd({ timeline: v })}
            blank={{ period: '', title: '', detail: '', tag: '' }}
            addLabel="เพิ่มรายการ"
            render={(it, u) => (
              <>
                <div className="g2">
                  <Field label="ช่วงเวลา" kind="text">
                    <input type="text" value={it.period} onChange={(e) => u({ period: e.target.value })} placeholder="2023 – ปัจจุบัน" />
                  </Field>
                  <Field label="ประเภท (ขึ้นเป็นป้ายสี)" kind="choice">
                    <select value={it.tag} onChange={(e) => u({ tag: e.target.value })}>
                      <option value="">ไม่ระบุ</option>
                      {it.tag && !TAGS.includes(it.tag) && <option value={it.tag}>{it.tag}</option>}
                      {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="หัวข้อ" kind="text">
                  <input type="text" value={it.title} onChange={(e) => u({ title: e.target.value })} placeholder="ชื่อสถานศึกษา / สาขา หรือชื่อคอร์ส" />
                </Field>
                <Field label="รายละเอียด" kind="text">
                  <textarea style={{ minHeight: 80 }} value={it.detail} onChange={(e) => u({ detail: e.target.value })} />
                </Field>
              </>
            )}
          />
        </Card>
      )}

      {tab === 'certs' && (
        <Card title="ใบรับรอง / คอร์ส / รางวัล" where={W.certs} hint="ส่วนนี้จะโผล่บนเว็บก็ต่อเมื่อมีรายการ เหมาะกับคนที่ยังไม่มีประสบการณ์ทำงาน เพราะแสดงว่าเรียนรู้และลงมือทำต่อเนื่อง">
          <ListEditor
            items={f.certificates}
            onChange={(v) => upd({ certificates: v })}
            blank={{ title: '', issuer: '', year: '', url: '' }}
            addLabel="เพิ่มใบรับรอง"
            render={(it, u) => (
              <>
                <Field label="ชื่อใบรับรอง / คอร์ส / รางวัล" kind="text">
                  <input type="text" value={it.title} onChange={(e) => u({ title: e.target.value })} placeholder="เช่น Responsive Web Design" />
                </Field>
                <div className="g2">
                  <Field label="ผู้จัด / สถาบัน" kind="text">
                    <input type="text" value={it.issuer} onChange={(e) => u({ issuer: e.target.value })} placeholder="เช่น freeCodeCamp" />
                  </Field>
                  <Field label="ปี" kind="text">
                    <input type="text" value={it.year} onChange={(e) => u({ year: e.target.value })} placeholder="2026" />
                  </Field>
                </div>
                <Field label="ลิงก์ตรวจสอบ (ถ้ามี)" kind="link">
                  <input type="text" value={it.url} onChange={(e) => u({ url: e.target.value })} placeholder="https://..." />
                </Field>
              </>
            )}
          />
        </Card>
      )}

      {tab === 'contact' && (
        <>
          <Card title="อีเมลและข้อความ" where={W.contact}>
            <Field label="อีเมลติดต่อ" kind="text">
              <input type="email" value={f.email} onChange={(e) => upd({ email: e.target.value })} />
            </Field>
            <Field label="ข้อความในส่วนติดต่อ" kind="text" hint="เช่น ตอบกลับภายใน 1–2 วัน (ใส่เฉพาะที่ทำได้จริง)">
              <input type="text" value={f.contact_note} onChange={(e) => upd({ contact_note: e.target.value })} />
            </Field>
            <Field label="กำลังมองหา" kind="list" hint="แสดงเป็นป้ายในส่วนติดต่อ ให้ผู้อ่านรู้ทันทีว่าติดต่อเรื่องอะไรได้">
              <TagInput value={f.looking_for} onChange={(v) => upd({ looking_for: v })} placeholder="เช่น ฝึกงาน, Web Developer, พร้อมเริ่มงานทันที" />
            </Field>
          </Card>
          <Card title="ช่องทางอื่นๆ" where={W.contact} hint="เช่น GitHub, LinkedIn, LINE ใช้ลิงก์ https:// (LINE ใช้ https://line.me/ti/p/~ไอดีไลน์) เบอร์โทร (tel:) จะเปิดเผยต่อทุกคน ใส่เมื่อมั่นใจเท่านั้น">
            <datalist id="soc">
              {['GitHub', 'LinkedIn', 'LINE', 'Facebook', 'Instagram', 'YouTube', 'Behance', 'Discord', 'TikTok'].map((x) => <option key={x} value={x} />)}
            </datalist>
            <ListEditor
              items={f.socials}
              onChange={(v) => upd({ socials: v })}
              blank={{ label: '', url: '' }}
              addLabel="เพิ่มช่องทาง"
              render={(it, u) => (
                <div className="g2">
                  <Field label="ชื่อปุ่ม" kind="text">
                    <input type="text" list="soc" value={it.label} onChange={(e) => u({ label: e.target.value })} placeholder="GitHub" />
                  </Field>
                  <Field label="ลิงก์" kind="link">
                    <input type="text" value={it.url} onChange={(e) => u({ url: e.target.value })} placeholder="https://github.com/ชื่อผู้ใช้" />
                  </Field>
                </div>
              )}
            />
          </Card>
        </>
      )}

      {tab === 'share' && (
        <Card title="ข้อมูลตอนแชร์ลิงก์" where={W.share} hint="เวลาส่งลิงก์เว็บใน LINE, Facebook หรืออีเมล และตอนค้นเจอใน Google จะแสดงชื่อ คำอธิบาย และรูปตามนี้ ถ้าเว้นว่างจะใช้ชื่อและข้อความแนะนำตัวให้เอง">
          <Field label="ชื่อที่แสดง" kind="text" hint="ควรสั้นกว่า 60 ตัวอักษร">
            <input type="text" value={f.seo_title} onChange={(e) => upd({ seo_title: e.target.value })} placeholder={`${f.name || 'ชื่อคุณ'} | Portfolio`} />
          </Field>
          <Field label="คำอธิบาย" kind="text" hint="ควรไม่เกิน 150 ตัวอักษร">
            <textarea style={{ minHeight: 80 }} value={f.seo_description} onChange={(e) => upd({ seo_description: e.target.value })} />
          </Field>
          <Field label="ตัวอย่างที่คนจะเห็น" hint="รูปที่ใช้คือรูปโปรไฟล์ (เปลี่ยนที่แท็บ เกี่ยวกับฉัน)">
            <div className="share-prev">
              {f.avatar_url ? <img src={f.avatar_url} alt="" /> : <div className="ph">ยังไม่มีรูปโปรไฟล์</div>}
              <div className="sp-b">
                <small>{host || 'your-site.vercel.app'}</small>
                <b>{f.seo_title.trim() || `${f.name || 'ชื่อคุณ'} | Portfolio`}</b>
                <p>{f.seo_description.trim() || f.tagline.trim() || DEFAULT_TAGLINE}</p>
              </div>
            </div>
          </Field>
        </Card>
      )}

      <SaveBar
        onSave={save}
        busy={busy}
        disabled={!loaded}
        status={
          msg ? <span style={{ fontWeight: 700 }}>{msg.t}</span>
            : dirty ? '● มีการเปลี่ยนแปลงที่ยังไม่บันทึก'
            : loaded ? `แท็บ: ${cur?.label ?? ''} · ข้อมูลล่าสุดแล้ว` : 'กำลังโหลด...'
        }
      />
    </>
  )
}
