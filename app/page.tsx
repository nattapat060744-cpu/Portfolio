import Portfolio from '@/components/Portfolio'
import { publicClient } from '@/lib/supabase/public'
import { normalizeSettings } from '@/lib/utils'
import type { Project } from '@/lib/types'

export const dynamic = 'force-dynamic' // always read fresh data from the database
export const fetchCache = 'force-no-store'

export default async function Home() {
  const sb = publicClient()
  const [{ data: projects }, { data: settings }] = await Promise.all([
    sb
      .from('projects')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }),
    sb.from('site_settings').select('*').eq('id', 1).maybeSingle(),
  ])

  return <Portfolio projects={(projects ?? []) as Project[]} settings={normalizeSettings(settings)} />
}
