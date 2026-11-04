'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import type { Project, Settings } from '@/lib/types'
import { CATS, coverSrc, socialIcon, tagMeta, ytId } from '@/lib/utils'

const WORDS = ['เว็บ', 'แอป', 'ระบบ', 'กราฟิก', 'วิดีโอ']
const WORD_COLORS = [1, 3, 4, 2, 5]

function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setSeen(true)
        io.disconnect()
      }
    }, { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, seen] as const
}

function Reveal({ id, children }: { id?: string; children: ReactNode }) {
  const [ref, seen] = useInView<HTMLElement>()
  return (
    <section id={id} ref={ref} className={'rv' + (seen ? ' in' : '')}>
      {children}
    </section>
  )
}

function Counter({ n }: { n: number }) {
  const [ref, seen] = useInView<HTMLElement>(0.5)
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!seen) return
    const t0 = performance.now()
    let id = 0
    const step = (t: number) => {
      const p = Math.min((t - t0) / 1200, 1)
      setV(Math.round(n * (1 - Math.pow(1 - p, 3))))
      if (p < 1) id = requestAnimationFrame(step)
    }
    id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [seen, n])
  return <b ref={ref}>{v}</b>
}

function Bar({ name, level }: { name: string; level: number }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.3)
  return (
    <div className="bar" ref={ref}>
      <div><span>{name}</span><span>{level}%</span></div>
      <p><i style={{ width: seen ? level + '%' : 0 }} /></p>
    </div>
  )
}

function Cover({ p }: { p: Project }) {
  const [failed, setFailed] = useState(false)
  const meta = CATS[p.category] ?? CATS.web
  const bg = `var(${meta[1]})`
  const src = failed ? null : coverSrc(p)
  if (src) {
    return (
      <div className="cover" style={{ background: bg }}>
        <img src={src} alt={p.title} loading="lazy" style={{ objectPosition: 'top' }} onError={() => setFailed(true)} />
      </div>
    )
  }
  let inner: ReactNode
  if (p.category === 'web' || p.category === 'system') {
    inner = <div className="m"><i /><i /><i /><u /><u /><u /></div>
  } else if (p.category === 'app') {
    inner = <div className="phone" />
  } else if (p.category === 'graphic') {
    inner = <div className="circ" />
  } else {
    inner = <div className="play">▶</div>
  }
  return <div className="cover" style={{ background: bg }}>{inner}</div>
}

function PjBlock({ h, v }: { h: string; v: string | null }) {
  if (!v) return null
  return (
    <div className="pj">
      <h4>{h}</h4>
      <p className="bio-t">{v}</p>
    </div>
  )
}

function tilt(e: ReactMouseEvent<HTMLElement>) {
  const c = e.currentTarget
  const r = c.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width - 0.5
  const y = (e.clientY - r.top) / r.height - 0.5
  c.style.transform = `perspective(800px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translate(-4px, -4px)`
}
function untilt(e: ReactMouseEvent<HTMLElement>) {
  e.currentTarget.style.transform = ''
}
function heroMove(e: ReactMouseEvent<HTMLElement>) {
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  el.style.setProperty('--mx', String((e.clientX - r.left) / r.width - 0.5))
  el.style.setProperty('--my', String((e.clientY - r.top) / r.height - 0.5))
}
function burst(x: number, y: number) {
  const colors = ['#ff4d6d', '#ffd23f', '#2ec4b6', '#9b87ff', '#ff9f1c']
  for (let i = 0; i < 24; i++) {
    const d = document.createElement('i')
    const a = Math.random() * Math.PI * 2
    const r = 60 + Math.random() * 100
    d.className = 'cf'
    d.style.cssText = `left:${x}px;top:${y}px;background:${colors[i % 5]};--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r - 40}px;--rot:${Math.random() * 720}deg`
    document.body.appendChild(d)
    setTimeout(() => d.remove(), 1000)
  }
}

export default function Portfolio({ projects, settings: s }: { projects: Project[]; settings: Settings }) {
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Project | null>(null)
  const [wi, setWi] = useState(0)
  const [swap, setSwap] = useState(false)
  const [toast, setToast] = useState('')
  const [active, setActive] = useState('')
  const [showTop, setShowTop] = useState(false)
  const [clock, setClock] = useState('')
  const words = s.hero_words.length > 0 ? s.hero_words : WORDS
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setInterval(() => {
      setSwap(true)
      setTimeout(() => {
        setWi((i) => (i + 1) % words.length)
        setSwap(false)
      }, 220)
    }, 2200)
    return () => clearInterval(id)
  }, [words.length])

  useEffect(() => {
    const on = () => {
      const h = document.documentElement
      setShowTop(h.scrollTop > 600)
      if (barRef.current) {
        barRef.current.style.width = (h.scrollTop / Math.max(h.scrollHeight - h.clientHeight, 1)) * 100 + '%'
      }
    }
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSel(null)
      const t = e.target as HTMLElement
      if (e.key === '/' && t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') {
        e.preventDefault()
        document.getElementById('q')?.focus()
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  useEffect(() => {
    document.body.style.overflow = sel ? 'hidden' : ''
  }, [sel])

  // highlight the nav link of the section currently on screen
  useEffect(() => {
    const els = ['work', 'about', 'path', 'certs', 'hire']
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el)
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-40% 0px -55% 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // live Thailand time in the contact section (useful for people in other time zones)
  useEffect(() => {
    const t = () =>
      setClock(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }))
    t()
    const id = setInterval(t, 30000)
    return () => clearInterval(id)
  }, [])

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return projects.filter(
      (p) =>
        (filter === 'all' || p.category === filter) &&
        (!t || (p.title + ' ' + (p.description ?? '') + ' ' + p.tech.join(' ')).toLowerCase().includes(t))
    )
  }, [projects, filter, q])

  // Stats are computed from the real projects, so they are always honest and need no manual editing
  const stats = useMemo(() => {
    if (projects.length === 0) return []
    const techs = new Set(projects.flatMap((p) => p.tech.map((t) => t.trim().toLowerCase()).filter(Boolean)))
    const out = [{ n: projects.length, label: 'ผลงานทั้งหมด' }]
    if (techs.size > 0) out.push({ n: techs.size, label: 'เทคโนโลยีและเครื่องมือ' })
    Object.keys(CATS)
      .filter((k) => k !== 'all')
      .forEach((k) => {
        const n = projects.filter((p) => p.category === k).length
        if (n > 0) out.push({ n, label: `งาน${CATS[k][0]}` })
      })
    return out
  }, [projects])

  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 2000)
  }

  const copyEmail = async (e: ReactMouseEvent) => {
    burst(e.clientX, e.clientY)
    try {
      await navigator.clipboard.writeText(s.email)
      flash('คัดลอกอีเมลแล้ว ✓')
    } catch {
      flash(s.email)
    }
  }

  const toggleTheme = () => {
    const r = document.documentElement
    const dark = r.dataset.theme === 'dark' || (!r.dataset.theme && window.matchMedia('(prefers-color-scheme:dark)').matches)
    r.dataset.theme = dark ? 'light' : 'dark'
  }

  const vid = sel ? ytId(sel.youtube_url) : null

  return (
    <>
      <div id="bar" ref={barRef} />
      <header>
        <div className="wrap">
          <a className="logo" href="#top">{s.name}<i /></a>
          <nav>
            <a href="#work" className={active === 'work' ? 'on' : ''}>ผลงาน</a>
            <a href="#about" className={active === 'about' ? 'on' : ''}>เกี่ยวกับ</a>
            {s.timeline.length > 0 && <a href="#path" className={active === 'path' ? 'on' : ''}>เส้นทาง</a>}
            {s.certificates.length > 0 && <a href="#certs" className={active === 'certs' ? 'on' : ''}>ใบรับรอง</a>}
            {(s.email || s.socials.length > 0) && <a href="#hire" className={active === 'hire' ? 'on' : ''}>ติดต่อ</a>}
            <button className="btn alt" onClick={toggleTheme} aria-label="สลับโหมด">◐</button>
          </nav>
        </div>
      </header>

      <main className="wrap" id="top">
        <div className="hero" onMouseMove={heroMove}>
          <div className="sticker s1">{s.status}</div>
          <div className="sticker s2" />
          <div className="sticker s3" />
          <div className="sticker ex s4" />
          <div className="sticker ex s5" />
          <div className="sticker ex s6" />
          <div className="sticker ex s7">+</div>
          <div className="sticker ex s8" />
          <div className="sticker ex s9">✦</div>
          <div className="sticker ex s10" />
          <span className="badge">👋 สวัสดีครับ ผม{s.name}</span>
          <h1>
            ชอบสร้าง
            <span className={'word' + (swap ? ' sw' : '')} style={{ background: `var(--c${WORD_COLORS[wi % WORD_COLORS.length]})` }}>
              {words[wi % words.length]}
            </span>
            <br />และลงมือทำจริง
          </h1>
          <p className="lead">{s.tagline}</p>
          <div className="cta">
            <a className="btn" href="#work">ดูผลงานของฉัน →</a>
            {s.resume_url ? (
              <a className="btn alt" href={s.resume_url} target="_blank" rel="noopener noreferrer">ดาวน์โหลดเรซูเม่</a>
            ) : (
              s.email && <a className="btn alt" href="#hire">ติดต่อ</a>
            )}
          </div>
          {stats.length > 0 && (
            <div className="stats">
              {stats.map((x, i) => (
                <div className="stat" key={i}><Counter n={x.n} /><span>{x.label}</span></div>
              ))}
            </div>
          )}
        </div>
      </main>

      {s.tools.length > 0 && (
        <div className="marq">
          <div>{[...s.tools, ...s.tools].map((t, i) => <span key={i}>{t}</span>)}</div>
        </div>
      )}

      <main className="wrap">
        <Reveal id="work">
          <div className="eyebrow">ผลงาน</div>
          <h2>ผลงานของฉัน</h2>
          <div className="tools">
            {Object.keys(CATS).map((k) => (
              <button key={k} className={'chip' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>
                {CATS[k][0]}
              </button>
            ))}
            <input id="q" placeholder="ค้นหาผลงาน..." aria-label="ค้นหา" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="grid">
            {list.length === 0 && <div className="empty">ยังไม่มีผลงานในหมวดนี้ หรือไม่พบคำที่ค้นหา</div>}
            {list.map((p, idx) => {
              const d = p.description ?? ''
              return (
                <button
                  className="card"
                  key={p.id}
                  onClick={() => setSel(p)}
                  onMouseMove={tilt}
                  onMouseLeave={untilt}
                  style={{ animationDelay: `${Math.min(idx, 8) * 60}ms` }}
                >
                  <Cover p={p} />
                  <div className="cbody">
                    <span className="cat" style={{ background: `var(${(CATS[p.category] ?? CATS.web)[1]})` }}>
                      {(CATS[p.category] ?? CATS.web)[0]}
                    </span>
                    {p.is_featured && <span className="cat feat">⭐ เด่น</span>}
                    <h3>{p.title}</h3>
                    <p>{d.length > 70 ? d.slice(0, 70) + '…' : d}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </Reveal>

        <Reveal id="about">
          <div className="deco" aria-hidden="true">
            <div className="sticker ab1">สวัสดี<br />👋</div>
            <div className="sticker ab2" />
            <div className="sticker ab3" />
            <div className="sticker ab4" />
            <div className="sticker ab5">✦</div>
          </div>
          <div className="eyebrow">เกี่ยวกับ</div>
          <h2>เกี่ยวกับฉัน</h2>
          <div className="bento">
            <div className="box b-bio">
              <h3 style={{ marginTop: 0, fontSize: 24 }}>เล่าเรื่องตัวเอง</h3>
              <p className="bio-t">{s.bio || 'ยังไม่ได้ใส่ข้อความแนะนำตัว'}</p>
              {s.facts.length > 0 && (
                <div className="facts">
                  {s.facts.map((f, i) => <span key={i}><b>{f.label}</b> {f.value}</span>)}
                </div>
              )}
            </div>
            <div className="box b-pic">
              {s.avatar_url ? <img src={s.avatar_url} alt={s.name} /> : s.name.charAt(0)}
              <span className="orb o1">💻</span>
              <span className="orb o2">🎨</span>
              <span className="orb o3">🎬</span>
            </div>
            {s.skills.length > 0 && (
              <div className="box b-skill">
                <h3 style={{ marginTop: 0 }}>ทักษะและสิ่งที่ทำได้</h3>
                <div className="skg">
                  {s.skills.map((k, i) => (
                    <div key={i} style={{ borderLeftColor: `var(--c${(i % 5) + 1})` }}>
                      <h4>{k.name}</h4>
                      <div className="tech">{k.items.map((t, j) => <span key={j}>{t}</span>)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {s.learning.length > 0 && (
              <div className="box b-learn">
                <h3><span className="dot" />กำลังเรียนรู้ / สนใจต่อยอด</h3>
                <div className="tech">{s.learning.map((t, i) => <span key={i}>{t}</span>)}</div>
              </div>
            )}
            {s.interests.length > 0 && (
              <div className="box b-int">
                <h3 style={{ marginTop: 0 }}>สิ่งที่สนใจ</h3>
                <div className="tech">{s.interests.map((t, i) => <span key={i}>{t}</span>)}</div>
              </div>
            )}
          </div>
        </Reveal>

        {s.timeline.length > 0 && (
          <Reveal id="path">
            <div className="eyebrow">เส้นทาง</div>
            <h2>การศึกษาและประสบการณ์</h2>
            <div className="tl">
              {s.timeline.map((t, i) => {
                const [emo, col] = tagMeta(t.tag)
                return (
                  <div key={i} style={{ animationDelay: `${i * 120}ms` }}>
                    <small>{t.period}</small>
                    <b>{t.title}</b>
                    {t.tag && <span className="tag-b" style={{ background: `var(${col})` }}>{emo} {t.tag}</span>}
                    {t.detail && <p>{t.detail}</p>}
                  </div>
                )
              })}
            </div>
          </Reveal>
        )}

        {s.certificates.length > 0 && (
          <Reveal id="certs">
            <div className="eyebrow">ใบรับรอง</div>
            <h2>ใบรับรองและรางวัล</h2>
            <div className="certs">
              {s.certificates.map((c, i) => (
                <div className="cert" key={i}>
                  {c.year && <div className="cy">{c.year}</div>}
                  <b>{c.title}</b>
                  {c.issuer && <p>{c.issuer}</p>}
                  {/^https?:\/\//i.test(c.url) && (
                    <a href={c.url} target="_blank" rel="noopener noreferrer">ดูใบรับรอง ↗</a>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        )}

        {(s.email || s.socials.length > 0) && (
          <Reveal id="hire">
            <div className="cta2">
              <span className="cb cb1">✉️</span>
              <span className="cb cb2">💬</span>
              <span className="cb cb3">✨</span>
              <h2>สนใจติดต่อ?</h2>
              <p>{s.contact_note || 'หากสนใจผลงานหรืออยากพูดคุยเพิ่มเติม ติดต่อได้ตามช่องทางด้านล่างครับ'}</p>
              {s.looking_for.length > 0 && (
                <div className="look">
                  <span>กำลังมองหา</span>
                  {s.looking_for.map((t, i) => <span className="lk" key={i}>{t}</span>)}
                </div>
              )}
              {s.email && <p><b className="mail" onClick={copyEmail} title="คลิกเพื่อคัดลอก">{s.email}</b></p>}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {s.email && (
                  <a className="btn" href={`mailto:${s.email}?subject=${encodeURIComponent('สนใจผลงานของคุณ')}`}>✉️ ส่งอีเมลหาฉัน</a>
                )}
                {s.email && <button className="btn alt" onClick={copyEmail}>คัดลอกอีเมล</button>}
                {s.resume_url && (
                  <a className="btn alt" href={s.resume_url} target="_blank" rel="noopener noreferrer">ดาวน์โหลดเรซูเม่</a>
                )}
                {s.socials.map((x, i) => (
                  <a key={i} className="btn alt" href={x.url} target={x.url.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{socialIcon(x.label)} {x.label}</a>
                ))}
              </div>
              {clock && (
                <p className="clk"><span className="live" />เวลาที่ประเทศไทยตอนนี้ {clock} น.</p>
              )}
            </div>
          </Reveal>
        )}
      </main>

      <footer className="f">© {new Date().getFullYear()} {s.name}</footer>

      {sel && (
        <div id="ov" className="open" onClick={(e) => e.target === e.currentTarget && setSel(null)}>
          <div id="md" role="dialog" aria-modal="true">
            <div style={{ position: 'relative' }}>
              <Cover p={sel} />
              <button className="btn alt x" onClick={() => setSel(null)}>✕ ปิด</button>
            </div>
            <div className="mb">
              <span className="cat" style={{ background: `var(${(CATS[sel.category] ?? CATS.web)[1]})` }}>
                {(CATS[sel.category] ?? CATS.web)[0]}
              </span>
              <h2 style={{ fontSize: 30, margin: '8px 0 0' }}>{sel.title}</h2>
              <div className="meta">
                {sel.year && <span>ปี {sel.year}</span>}
                {sel.role && <span>บทบาท: {sel.role}</span>}
                {sel.status && <span>สถานะ: {sel.status}</span>}
                {sel.team && <span>{sel.team}</span>}
              </div>
              {sel.description && <p className="bio-t">{sel.description}</p>}
              <PjBlock h="🎯 ทำเพื่ออะไร" v={sel.goal} />
              <PjBlock h="🛠 ส่วนที่ฉันทำ" v={sel.contribution} />
              <PjBlock h="✅ ผลลัพธ์ / สิ่งที่ได้เรียนรู้" v={sel.outcome} />
              {(sel.gallery ?? []).length > 0 && (
                <div className="gal">
                  {(sel.gallery ?? []).map((u, i) => (
                    <a key={i} href={u} target="_blank" rel="noopener noreferrer">
                      <img src={u} alt={`${sel.title} ${i + 1}`} loading="lazy" />
                    </a>
                  ))}
                </div>
              )}
              {sel.tech.length > 0 && <div className="tech">{sel.tech.map((t, i) => <span key={i}>{t}</span>)}</div>}
              {vid && (
                <div className="yt">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${vid}`}
                    title={sel.title}
                    allow="accelerometer; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
              <div className="acts">
                {sel.demo_url && <a className="btn" href={sel.demo_url} target="_blank" rel="noopener noreferrer">ดูตัวอย่าง ↗</a>}
                {sel.github_url && <a className="btn alt" href={sel.github_url} target="_blank" rel="noopener noreferrer">GitHub</a>}
                {sel.youtube_url && <a className="btn alt" href={sel.youtube_url} target="_blank" rel="noopener noreferrer">เปิดใน YouTube</a>}
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        className={'totop' + (showTop ? ' show' : '')}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="กลับขึ้นด้านบน"
      >
        ↑
      </button>

      <div id="toast" className={toast ? 'show' : ''}>{toast}</div>
    </>
  )
}
