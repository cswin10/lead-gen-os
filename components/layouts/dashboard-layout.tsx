'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Phone, Settings, LogOut, BarChart3, FileText, Zap, Menu, X } from 'lucide-react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const getNavItems = () => {
    if (user.role === 'owner' || user.role === 'manager') {
      return [
        { href: '/dashboard/management', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/management/reports', label: 'Reports', icon: FileText },
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

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="border-b px-4 sm:px-6 py-4 bg-gradient-to-r from-primary/5 to-transparent">
        <h1 className="text-lg sm:text-xl font-bold text-primary animate-fadeIn">LeadGen OS</h1>
        <p className="text-xs text-muted-foreground animate-fadeIn truncate">{user.organizations?.name}</p>
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
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
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
          <p className="text-sm font-medium truncate">{user.full_name || user.email}</p>
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
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-primary">LeadGen OS</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        'lg:hidden fixed left-0 top-0 z-50 h-screen w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col pt-14">
          <NavContent />
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white shadow-sm">
        <div className="flex h-full flex-col">
          <NavContent />
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 flex flex-col min-h-screen pt-14 lg:pt-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl animate-fadeIn">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}
