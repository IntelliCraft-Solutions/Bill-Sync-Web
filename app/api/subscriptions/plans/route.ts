import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    })

    if (!plans || plans.length === 0) {
      console.error('No active plans found in database')
      return NextResponse.json(
        { error: 'No subscription plans available. Please contact support.' },
        { status: 404 }
      )
    }

    // Format plans for frontend
    const formattedPlans = plans.map(plan => {
      // Handle features - could be array or object
      let features: string[] = []
      if (Array.isArray(plan.features)) {
        features = (plan.features as any[]).map(f => String(f))
      } else if (typeof plan.features === 'object' && plan.features !== null) {
        features = Object.values(plan.features).map(f => String(f))
      }
      
      // Handle limits
      let limits: any = {}
      if (typeof plan.limits === 'object' && plan.limits !== null) {
        limits = plan.limits
      }
      
      return {
        id: plan.id,
        name: plan.name,
        displayName: plan.displayName,
        price: plan.price,
        currency: plan.currency || 'INR',
        features: features,
        limits: limits,
      }
    })

    console.log(`Returning ${formattedPlans.length} plans:`, formattedPlans.map(p => p.name))
    return NextResponse.json(formattedPlans)
  } catch (error: any) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

