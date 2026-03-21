import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  Lightbulb,
  Smartphone,
  Bookmark,
  Users,
  Sparkles,
  History,
  Menu,
  Clock,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/utils'

const navigation = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Keyword Research', to: '/keywords', icon: Search },
  { name: 'Keyword Jobs', to: '/jobs', icon: Clock },
  { name: 'Opportunity Finder', to: '/opportunities', icon: Lightbulb },
  { name: 'My Tracking', to: '/tracking', icon: Bookmark },
  { name: 'App Explorer', to: '/apps', icon: Smartphone },
  { name: 'Competitors', to: '/competitors', icon: Users },
  { name: 'AI Tools', to: '/ai-tools', icon: Sparkles },
  { name: 'History', to: '/history', icon: History },
]

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-stone-800',
          'transform transition-transform duration-300 ease-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-stone-800 px-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-warm flex items-center justify-center glow-orange-sm animate-pulse">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gradient">ASO Platform</h1>
                <p className="text-xs text-muted-foreground">Keyword Research</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center space-x-3 rounded-xl px-3 py-2.5',
                    'text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(244,157,37,0.15)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )
                }
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-stone-800 p-4">
            <div className="rounded-xl bg-gradient-warm/10 p-4 hover-lift transition-all duration-300">
              <p className="text-xs font-semibold text-primary mb-1">Pro Tip</p>
              <p className="text-xs text-muted-foreground">
                Track keywords daily for best results
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-stone-800/50 bg-background/80 backdrop-blur-xl">
          <div className="flex flex-1 items-center justify-between px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-xl p-2 hover:bg-accent transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-4 ml-auto">
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <div className="relative">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
                </div>
                <span className="text-muted-foreground">API Connected</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
