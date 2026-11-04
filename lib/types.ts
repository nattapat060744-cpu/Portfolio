export type Category = 'system' | 'web' | 'app' | 'graphic' | 'video'

export interface Project {
  id: string
  title: string
  slug: string
  category: Category
  description: string | null
  tech: string[]
  cover_url: string | null
  gallery: string[]
  youtube_url: string | null
  demo_url: string | null
  github_url: string | null
  year: number | null
  role: string | null
  goal: string | null
  contribution: string | null
  outcome: string | null
  is_featured: boolean
  status: string | null
  team: string | null
  is_published: boolean
  sort_order: number
  created_at: string
}

export interface Settings {
  name: string
  tagline: string
  bio: string
  email: string
  stats: { n: number; label: string }[]
  skills: { name: string; items: string[] }[]
  timeline: { period: string; title: string; detail: string; tag: string }[]
  tools: string[]
  status: string
  resume_url: string
  avatar_url: string
  socials: { label: string; url: string }[]
  facts: { label: string; value: string }[]
  learning: string[]
  contact_note: string
  looking_for: string[]
  hero_words: string[]
  interests: string[]
  certificates: { title: string; issuer: string; year: string; url: string }[]
  seo_title: string
  seo_description: string
}
