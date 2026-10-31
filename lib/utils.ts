import type { Settings } from './types'

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
    skills: x.skills ?? [],
    timeline: x.timeline ?? [],
    tools: x.tools ?? [],
  }
}

// ----- helpers for admin textareas (one item per line, parts split by "|") -----
export const statsToText = (a: Settings['stats']) => a.map((i) => `${i.n}|${i.label}`).join('\n')
export const textToStats = (t: string): Settings['stats'] =>
  t.split('\n').map((l) => l.split('|')).filter((p) => p.length >= 2 && p[0].trim())
    .map((p) => ({ n: Number(p[0]) || 0, label: p.slice(1).join('|').trim() }))

export const skillsToText = (a: Settings['skills']) => a.map((i) => `${i.name}|${i.level}`).join('\n')
export const textToSkills = (t: string): Settings['skills'] =>
  t.split('\n').map((l) => l.split('|')).filter((p) => p.length >= 2 && p[0].trim())
    .map((p) => ({ name: p[0].trim(), level: Math.min(100, Math.max(0, Number(p[1]) || 0)) }))

export const timelineToText = (a: Settings['timeline']) => a.map((i) => `${i.period}|${i.title}|${i.detail}`).join('\n')
export const textToTimeline = (t: string): Settings['timeline'] =>
  t.split('\n').map((l) => l.split('|')).filter((p) => p.length >= 2 && p[0].trim())
    .map((p) => ({ period: p[0].trim(), title: p[1].trim(), detail: (p[2] ?? '').trim() }))

export const toolsToText = (a: string[]) => a.join(', ')
export const textToTools = (t: string) => t.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
