import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from '@/components/auth/login-form'

export default async function Home() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // Get user profile to determine dashboard
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      switch (profile.role) {
        case 'owner':
        case 'manager':
          redirect('/dashboard/management')
        case 'agent':
          redirect('/dashboard/agent')
        case 'client':
          redirect('/dashboard/client')
        default:
          redirect('/dashboard/agent')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">LeadGen OS</h1>
          <p className="text-gray-600">Your Lead Generation Operating System</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  )
}
