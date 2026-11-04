import type { Project, Settings } from './types'
import { DEFAULT_TAGLINE, coverSrc } from './utils'

export type Missing = { label: string; href: string }
export type SectionInfo = {
  id: string
  icon: string
  name: string
  shows: string // what this section contains
  edit: string // admin page that edits it
  anchor?: string // anchor on the public site ('' = top of page, undefined = none)
  done: number
  total: number
  missing: Missing[]
}

type Check = [boolean, string, string] // [done?, label, where to fix]

function mk(id: string, icon: string, name: string, shows: string, edit: string, anchor: string | undefined, checks: Check[]): SectionInfo {
  return {
    id, icon, name, shows, edit, anchor,
    done: checks.filter((c) => c[0]).length,
    total: checks.length,
    missing: checks.filter((c) => !c[0]).map((c) => ({ label: c[1], href: c[2] })),
  }
}

const tab = (t: string) => `/admin/settings?tab=${t}`

// the public site split into sections, with a completeness check for each
export function buildSections(s: Settings, projects: Project[]): SectionInfo[] {
  const pub = projects.filter((p) => p.is_published)
  const story = pub.filter((p) => p.goal && p.contribution && p.outcome).length
  const realEmail = !!s.email && s.email !== 'hello@example.com'
  const hasEdu = s.timeline.some((t) => /ศึกษา|เรียน|edu/i.test(t.tag))
  const realTimeline = s.timeline.length > 0 && !s.timeline.some((t) => t.title.includes('Freelance Developer & Creative'))

  return [
    mk('home', '🏠', 'หน้าแรก', 'ชื่อ · ข้อความแนะนำ · สติกเกอร์ · คำสลับ · เรซูเม่ · แถบเครื่องมือ', tab('home'), '', [
      [s.name !== 'ชื่อคุณ', 'ใส่ชื่อของคุณ', tab('home')],
      [s.tagline !== DEFAULT_TAGLINE, 'เขียนข้อความแนะนำตัวใต้หัวข้อ', tab('home')],
      [!!s.resume_url, 'อัปโหลดเรซูเม่ (PDF)', tab('home')],
      [s.tools.length > 0, 'ใส่เครื่องมือที่ใช้ (แถบวิ่งหน้าแรก)', tab('home')],
    ]),
    mk('work', '🗂', 'ผลงาน', 'การ์ดผลงาน · หน้ารายละเอียด · แกลเลอรี · วิดีโอ', '/admin/projects', '#work', [
      [pub.length >= 1, 'เพิ่มผลงานชิ้นแรก', '/admin/projects/new'],
      [pub.length >= 3, `มีผลงานที่แสดงอย่างน้อย 3 ชิ้น (ตอนนี้ ${pub.length})`, '/admin/projects/new'],
      [pub.length > 0 && story === pub.length, `เขียนเรื่องราวผลงานครบทุกชิ้น (${story}/${pub.length})`, '/admin/projects'],
      [pub.length > 0 && pub.every((p) => !!coverSrc(p)), 'ทุกผลงานมีรูปปกหรือลิงก์ Demo', '/admin/projects'],
    ]),
    mk('about', '✨', 'เกี่ยวกับฉัน', 'รูปโปรไฟล์ · เรื่องราว · ข้อมูลโดยย่อ · ทักษะ · สิ่งที่สนใจ · กำลังเรียนรู้', tab('about'), '#about', [
      [!!s.avatar_url, 'อัปโหลดรูปโปรไฟล์', tab('about')],
      [!!s.bio.trim() && !s.bio.includes('/admin/settings'), 'เขียนเล่าเรื่องตัวเอง', tab('about')],
      [s.facts.length > 0, 'ใส่ข้อมูลโดยย่อ (พื้นที่ สถานะ ภาษา)', tab('about')],
      [s.skills.some((k) => k.items.length > 0), 'ใส่ทักษะพร้อมรายการเครื่องมือ', tab('about')],
      [s.interests.length > 0, 'ใส่สิ่งที่สนใจ / งานอดิเรก', tab('about')],
      [s.learning.length > 0, 'ใส่สิ่งที่กำลังเรียนรู้', tab('about')],
    ]),
    mk('path', '🎓', 'การศึกษา / ประสบการณ์', 'ไทม์ไลน์การศึกษา คอร์ส กิจกรรม และงานที่เคยทำ', tab('path'), '#path', [
      [realTimeline, 'ใส่การศึกษาและประสบการณ์จริง', tab('path')],
      [hasEdu, 'มีรายการประเภท "การศึกษา"', tab('path')],
    ]),
    mk('certs', '🏅', 'ใบรับรอง / รางวัล', 'ใบรับรอง คอร์ส รางวัล พร้อมผู้จัดและปี', tab('certs'), '#certs', [
      [s.certificates.length > 0, 'เพิ่มใบรับรอง / คอร์ส / รางวัล (ไม่บังคับ แต่ช่วยได้มาก)', tab('certs')],
    ]),
    mk('contact', '📬', 'ติดต่อ', 'อีเมล · ช่องทางอื่น · สิ่งที่กำลังมองหา · ข้อความตอบกลับ', tab('contact'), '#hire', [
      [realEmail, 'ใส่อีเมลติดต่อจริง', tab('contact')],
      [s.socials.length > 0, 'เพิ่มช่องทางติดต่อ (GitHub / LINE / LinkedIn)', tab('contact')],
      [s.looking_for.length > 0, 'ระบุสิ่งที่กำลังมองหา (ฝึกงาน / ตำแหน่งงาน)', tab('contact')],
      [!!s.contact_note, 'เขียนข้อความในส่วนติดต่อ', tab('contact')],
    ]),
    mk('share', '🔗', 'ตอนแชร์ลิงก์', 'ชื่อ คำอธิบาย และรูปที่ขึ้นเวลาส่งลิงก์ใน LINE / Facebook / Google', tab('share'), undefined, [
      [!!s.seo_title, 'ตั้งชื่อที่จะขึ้นตอนแชร์ลิงก์', tab('share')],
      [!!s.seo_description, 'เขียนคำอธิบายสั้นๆ ตอนแชร์ลิงก์', tab('share')],
      [!!s.avatar_url, 'อัปโหลดรูปโปรไฟล์ (ใช้เป็นรูปตอนแชร์)', tab('about')],
    ]),
  ]
}
