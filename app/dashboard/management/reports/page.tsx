import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import ReportsClient from '@/components/management/reports-client'

export const revalidate = 30

export default async function ReportsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(name)')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    redirect('/dashboard/agent')
  }

  // Fetch recent reports
  const { data: reports } = await supabase
    .from('reports')
    .select('*, created_by_profile:profiles!created_by(full_name)')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <DashboardLayout user={profile}>
      <ReportsClient initialReports={reports || []} />
    </DashboardLayout>
  )
}
