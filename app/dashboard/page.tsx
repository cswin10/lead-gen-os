import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardRoot() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/')
  }

  // Route based on user role
  switch (profile.role) {
    case 'owner':
    case 'manager':
      redirect('/dashboard/management')
    case 'agent':
      redirect('/dashboard/agent')
    case 'client':
      redirect('/dashboard/client')
    default:
      redirect('/')
  }
}
