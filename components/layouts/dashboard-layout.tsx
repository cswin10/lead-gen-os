'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Phone, Settings, LogOut, BarChart3, FileText, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface DashboardLayoutProps {
  children: ReactNode
  user: any
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const getNavItems = () => {
    if (user.role === 'owner' || user.role === 'manager') {
      return [
        { href: '/dashboard/management', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/management/clients', label: 'Clients', icon: Users },
        { href: '/dashboard/management/campaigns', label: 'Campaigns', icon: BarChart3 },
        { href: '/dashboard/management/leads', label: 'Leads', icon: Users },
        { href: '/dashboard/management/team', label: 'Team', icon: Users },
        { href: '/dashboard/management/settings', label: 'Settings', icon: Settings },
      ]
    } else if (user.role === 'agent') {
      return [
        { href: '/dashboard/agent', label: 'My Leads', icon: Users },
        { href: '/dashboard/agent/calls', label: 'Calls', icon: Phone },
        { href: '/dashboard/agent/performance', label: 'Performance', icon: BarChart3 },
      ]
    } else {
      return [
        { href: '/dashboard/client', label: 'Overview', icon: LayoutDashboard },
        { href: '/dashboard/client/leads', label: 'Leads', icon: Users },
      ]
    }
  }

  const navItems = getNavItems()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b px-6 py-4">
            <h1 className="text-xl font-bold text-primary">LeadGen OS</h1>
            <p className="text-xs text-muted-foreground">{user.organizations?.name}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="border-t p-4">
            <div className="mb-2">
              <p className="text-sm font-medium">{user.full_name || user.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}
