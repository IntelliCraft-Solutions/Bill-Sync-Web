'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Users, 
  BarChart3, 
  LogOut,
  Receipt,
  Settings,
  CreditCard,
  X
} from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  role: 'ADMIN' | 'CASHIER'
  businessName?: string
}

export default function Sidebar({ role, businessName }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

    const adminLinks = [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/inventory', label: 'Inventory', icon: Package },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/admin/employees', label: 'Employees', icon: Users },
      { href: '/admin/reports', label: 'Reports', icon: FileText },
      { href: '/admin/settings/subscription', label: 'Subscription', icon: CreditCard },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ]


  const cashierLinks = [
    { href: '/cashier/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/cashier/billing', label: 'Create Bill', icon: Receipt },
  ]

  const links = role === 'ADMIN' ? adminLinks : cashierLinks

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <>
      {/* Mobile menu button with animated hamburger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 text-gray-700 hover:text-primary-600 active:text-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <div className="w-6 h-5 flex flex-col justify-center gap-1.5 relative">
          <span
            className={`block h-0.5 w-6 bg-current transition-all duration-300 ease-in-out origin-center ${
              isOpen ? 'rotate-45 translate-y-2' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-current transition-all duration-300 ease-in-out ${
              isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-current transition-all duration-300 ease-in-out origin-center ${
              isOpen ? '-rotate-45 -translate-y-2' : ''
            }`}
          />
        </div>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-800">
            {/* Close button for mobile - at the top */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Business name and role - below the close button on mobile */}
            <div>
              <h1 className="text-lg sm:text-xl font-bold break-words">{businessName || 'Billing System'}</h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{role}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
