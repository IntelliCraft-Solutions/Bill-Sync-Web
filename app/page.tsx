import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    if (session.user.role === 'ADMIN') {
      redirect('/admin/dashboard')
    } else if (session.user.role === 'CASHIER') {
      redirect('/cashier/dashboard')
    }
  }

  return <LandingPage />
}
