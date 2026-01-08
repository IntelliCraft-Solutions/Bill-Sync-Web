'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  role: 'ADMIN' | 'CASHIER'
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!session || session.user.role !== role) {
    redirect('/auth/signin')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} businessName={session.user.name} />
      <main className="flex-1 lg:ml-64 p-4 md:p-8 pt-16 lg:pt-4 md:pt-8">
        {children}
      </main>
    </div>
  )
}
