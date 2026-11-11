import AdminShell from '@/components/admin/AdminShell'

export const metadata = { title: 'หลังบ้าน – Portfolio', robots: { index: false, follow: false } }

// Admin pages talk to Supabase at render time, so never prerender them at build (no env needed to build)
export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
