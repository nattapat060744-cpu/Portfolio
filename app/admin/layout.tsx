import AdminNav from '@/components/AdminNav'

export const metadata = { title: 'หลังบ้าน – Portfolio', robots: { index: false, follow: false } }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="adm">
      <AdminNav />
      {children}
    </div>
  )
}
