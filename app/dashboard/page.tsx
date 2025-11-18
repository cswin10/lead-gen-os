import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardRoot() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Profile fetch error:', profileError, 'User ID:', user.id)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-2">User ID: {user.id}</p>
          <p className="text-gray-600 mb-4">Error: {profileError?.message || 'Profile does not exist'}</p>
          <p className="text-sm text-gray-500">Check Supabase profiles table</p>
        </div>
      </div>
    )
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
