import type { Project, Settings } from './types'

// label + css color variable per category
export const CATS: Record<string, [string, string]> = {
  all: ['ทั้งหมด', ''],
  system: ['ระบบ', '--c4'],
  web: ['เว็บ', '--c1'],
  app: ['แอป', '--c3'],
  graphic: ['กราฟิก', '--c2'],
  video: ['วิดีโอ', '--c5'],
}

export function ytId(url: string | null): string | null {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)
  return m ? m[1] : null
}

// Cover image: uploaded image -> YouTube thumbnail -> screenshot of the demo link -> null (CSS pattern)
export function coverSrc(p: Pick<Project, 'cover_url' | 'youtube_url' | 'demo_url'>): string | null {
  if (p.cover_url) return p.cover_url
  const v = ytId(p.youtube_url)
  if (v) return `https://img.youtube.com/vi/${v}/hqdefault.jpg`
  if (p.demo_url) return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(p.demo_url)}?w=900&h=560`
  return null
}

export function slugify(s: string): string {
  const slug = s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'p-' + Date.now().toString(36)
}

export function normalizeSettings(d: Record<string, unknown> | null): Settings {
  const x = (d ?? {}) as Partial<Settings>
  return {
    name: x.name || 'ชื่อคุณ',
    tagline: x.tagline || 'นักพัฒนาและครีเอทีฟที่ทำได้ตั้งแต่ระบบหลังบ้าน เว็บ แอป ไปจนถึงงานกราฟิกและตัดต่อวิดีโอ',
    bio: x.bio || '',
    email: x.email || '',
    stats: x.stats ?? [],
    skills: (x.skills ?? []).map((k) => ({ name: k.name, items: Array.isArray(k.items) ? k.items : [] })),
    timeline: (x.timeline ?? []).map((t) => ({ period: t.period, title: t.title, detail: t.detail ?? '', tag: t.tag ?? '' })),
    tools: x.tools ?? [],
    status: x.status || 'เปิดรับโอกาส',
    resume_url: x.resume_url || '',
    avatar_url: x.avatar_url || '',
    socials: (Array.isArray(x.socials) ? x.socials : []).filter((k) => k && /^(https?:\/\/|mailto:|tel:)/i.test(k.url)),
    facts: x.facts ?? [],
    learning: x.learning ?? [],
    contact_note: x.contact_note || '',
    looking_for: x.looking_for ?? [],
  }
}

// ----- helpers for admin textareas (one item per line, parts split by "|") -----
export const statsToText = (a: Settings['stats']) => a.map((i) => `${i.n}|${i.label}`).join('\n')
export const textToStats = (t: string): Settings['stats'] =>
  t.split('\n').map((l) => l.split('|')).filter((p) => p.length >= 2 && p[0].trim())
    .map((p) => ({ n: Number(p[0]) || 0, label: p.slice(1).join('|').trim() }))

export const skillsToText = (a: Settings['skills']) => a.map((i) => `${i.name}|${i.items.join(', ')}`).join('\n')
export const textToSkills = (t: string): Settings['skills'] =>
  t.split('\n').map((l) => l.split('|')).filter((p) => p.length >= 2 && p[0].trim())
    .map((p) => ({
      name: p[0].trim(),
      items: p.slice(1).join('|').split(/[,，]/).map((s) => s.trim()).filter(Boolean),
    }))

export const timelineToText = (a: Settings['timeline']) => a.map((i) => `${i.period}|${i.title}|${i.detail}|${i.tag}`).join('\n')
export const textToTimeline = (t: string): Settings['timeline'] =>
  t.split('\n').map((l) => l.split('|')).filter((p) => p.length >= 2 && p[0].trim())
    .map((p) => ({ period: p[0].trim(), title: p[1].trim(), detail: (p[2] ?? '').trim(), tag: (p[3] ?? '').trim() }))

export const socialsToText = (a: Settings['socials']) => a.map((i) => `${i.label}|${i.url}`).join('\n')
export const textToSocials = (t: string): Settings['socials'] =>
  t.split('\n').map((l) => l.split('|')).filter((p) => p.length >= 2 && p[0].trim() && p[1].trim())
    .map((p) => ({ label: p[0].trim(), url: p.slice(1).join('|').trim() }))

export const factsToText = (a: Settings['facts']) => a.map((i) => `${i.label}|${i.value}`).join('\n')
export const textToFacts = (t: string): Settings['facts'] =>
  t.split('\n').map((l) => l.split('|')).filter((p) => p.length >= 2 && p[0].trim() && p[1].trim())
    .map((p) => ({ label: p[0].trim(), value: p.slice(1).join('|').trim() }))

export function socialIcon(label: string): string {
  const l = label.trim().toLowerCase()
  if (l === 'x') return '✖️'
  const map: [string, string][] = [
    ['github', '🐙'], ['linkedin', '💼'], ['facebook', '📘'], ['instagram', '📸'], ['youtube', '▶️'],
    ['line', '💬'], ['behance', '🎨'], ['dribbble', '🏀'], ['discord', '🎮'], ['tiktok', '🎵'],
    ['twitter', '🐦'], ['เบอร์', '📞'], ['โทร', '📞'], ['tel', '📞'], ['mail', '✉️'], ['อีเมล', '✉️'],
  ]
  return map.find(([k]) => l.includes(k))?.[1] ?? '🔗'
}

// timeline badge: [emoji, css color var] chosen from the tag text
export function tagMeta(tag: string): [string, string] {
  const t = tag.toLowerCase()
  if (!t) return ['', '--c5']
  if (/ศึกษา|เรียน|edu|school|uni/.test(t)) return ['🎓', '--c3']
  if (/คอร์ส|อบรม|ใบรับรอง|cert|course/.test(t)) return ['📚', '--c4']
  if (/กิจกรรม|รางวัล|แข่ง|award|activity|contest/.test(t)) return ['🏆', '--c2']
  if (/งาน|work|intern|job/.test(t)) return ['💼', '--c1']
  return ['📌', '--c5']
}

export const toolsToText = (a: string[]) => a.join(', ')
export const textToTools = (t: string) => t.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
