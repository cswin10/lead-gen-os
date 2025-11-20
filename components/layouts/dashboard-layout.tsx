'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Phone, Settings, LogOut, BarChart3, FileText, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Footer } from '@/components/layouts/footer'

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
        { href: '/dashboard/settings', label: 'Settings', icon: Settings },
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
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white shadow-sm">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b px-6 py-4 bg-gradient-to-r from-primary/5 to-transparent">
            <h1 className="text-xl font-bold text-primary animate-fadeIn">LeadGen OS</h1>
            <p className="text-xs text-muted-foreground animate-fadeIn">{user.organizations?.name}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                    'hover:scale-[1.02] active:scale-[0.98]',
                    'animate-slideIn',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="border-t p-4 bg-gray-50/50">
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
      <div className="ml-64 flex flex-col min-h-screen">
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-7xl animate-fadeIn">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}
