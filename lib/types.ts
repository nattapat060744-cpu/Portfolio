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
  skills: { name: string; level: number }[]
  timeline: { period: string; title: string; detail: string }[]
  tools: string[]
}
