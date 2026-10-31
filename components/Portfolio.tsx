'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Project, Settings } from '@/lib/types'
import { CATS, ytId } from '@/lib/utils'

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
  return <b ref={ref}>{v}{seen && v >= n ? '+' : ''}</b>
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
  const meta = CATS[p.category] ?? CATS.web
  const bg = `var(${meta[1]})`
  if (p.cover_url) {
    return <div className="cover" style={{ background: bg }}><img src={p.cover_url} alt={p.title} loading="lazy" /></div>
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

export default function Portfolio({ projects, settings: s }: { projects: Project[]; settings: Settings }) {
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Project | null>(null)
  const [wi, setWi] = useState(0)
  const [swap, setSwap] = useState(false)
  const [toast, setToast] = useState('')
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setInterval(() => {
      setSwap(true)
      setTimeout(() => {
        setWi((i) => (i + 1) % WORDS.length)
        setSwap(false)
      }, 220)
    }, 2200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const on = () => {
      const h = document.documentElement
      if (barRef.current) {
        barRef.current.style.width = (h.scrollTop / Math.max(h.scrollHeight - h.clientHeight, 1)) * 100 + '%'
      }
    }
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setSel(null)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  useEffect(() => {
    document.body.style.overflow = sel ? 'hidden' : ''
  }, [sel])

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return projects.filter(
      (p) =>
        (filter === 'all' || p.category === filter) &&
        (!t || (p.title + ' ' + (p.description ?? '') + ' ' + p.tech.join(' ')).toLowerCase().includes(t))
    )
  }, [projects, filter, q])

  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 2000)
  }

  const copyEmail = async () => {
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
            <a href="#work">ผลงาน</a>
            <a href="#about">เกี่ยวกับ</a>
            {s.timeline.length > 0 && <a href="#path">เส้นทาง</a>}
            {s.email && <a href="#hire">ติดต่อ</a>}
            <button className="btn alt" onClick={toggleTheme} aria-label="สลับโหมด">◐</button>
          </nav>
        </div>
      </header>

      <main className="wrap" id="top">
        <div className="hero">
          <div className="sticker s1">พร้อม<br />รับงาน<br />2026</div>
          <div className="sticker s2" />
          <div className="sticker s3" />
          <span className="badge">👋 สวัสดีครับ</span>
          <h1>
            ผมสร้าง
            <span className={'word' + (swap ? ' sw' : '')} style={{ background: `var(--c${WORD_COLORS[wi]})` }}>
              {WORDS[wi]}
            </span>
            <br />ให้ดูดีและใช้งานได้จริง
          </h1>
          <p className="lead">{s.tagline}</p>
          <div className="cta">
            <a className="btn" href="#work">ดูผลงานทั้งหมด →</a>
            {s.email && <a className="btn alt" href="#hire">คุยงานกัน</a>}
          </div>
          {s.stats.length > 0 && (
            <div className="stats">
              {s.stats.map((x, i) => (
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
          <h2>งานที่ภูมิใจนำเสนอ</h2>
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
            {list.map((p) => {
              const d = p.description ?? ''
              return (
                <button className="card" key={p.id} onClick={() => setSel(p)}>
                  <Cover p={p} />
                  <div className="cbody">
                    <span className="cat" style={{ background: `var(${(CATS[p.category] ?? CATS.web)[1]})` }}>
                      {(CATS[p.category] ?? CATS.web)[0]}
                    </span>
                    <h3>{p.title}</h3>
                    <p>{d.length > 70 ? d.slice(0, 70) + '…' : d}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </Reveal>

        <Reveal id="about">
          <div className="eyebrow">เกี่ยวกับ</div>
          <h2>รู้จักผมให้มากขึ้น</h2>
          <div className="bento">
            <div className="box b-bio">
              <h3 style={{ marginTop: 0, fontSize: 24 }}>เล่าเรื่องตัวเอง</h3>
              <p className="bio-t">{s.bio || 'ยังไม่ได้ใส่ข้อความแนะนำตัว'}</p>
            </div>
            <div className="box b-pic">{s.name.charAt(0)}</div>
            {s.skills.length > 0 && (
              <div className="box b-skill">
                <h3 style={{ marginTop: 0 }}>ทักษะ</h3>
                {s.skills.map((k, i) => <Bar key={i} name={k.name} level={k.level} />)}
              </div>
            )}
            {s.tools.length > 0 && (
              <div className="box b-tool">
                <h3 style={{ marginTop: 0 }}>เครื่องมือที่ใช้</h3>
                <div className="tech">{s.tools.map((t, i) => <span key={i}>{t}</span>)}</div>
              </div>
            )}
          </div>
        </Reveal>

        {s.timeline.length > 0 && (
          <Reveal id="path">
            <div className="eyebrow">เส้นทาง</div>
            <h2>ประสบการณ์</h2>
            <div className="tl">
              {s.timeline.map((t, i) => (
                <div key={i}><small>{t.period}</small><b>{t.title}</b><p>{t.detail}</p></div>
              ))}
            </div>
          </Reveal>
        )}

        {s.email && (
          <Reveal id="hire">
            <div className="cta2">
              <h2>มาสร้างงานดีๆ ด้วยกันไหม?</h2>
              <p>มีไอเดียหรือโปรเจกต์ในใจ ทักมาคุยกันได้เลย</p>
              <button className="btn alt" onClick={copyEmail}>คัดลอกอีเมล</button>
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
              </div>
              {sel.description && <p className="bio-t">{sel.description}</p>}
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

      <div id="toast" className={toast ? 'show' : ''}>{toast}</div>
    </>
  )
}
