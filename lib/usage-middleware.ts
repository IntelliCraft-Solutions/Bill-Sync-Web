import { NextRequest, NextResponse } from 'next/server'
import { checkQuota, MetricType } from './usage-tracker'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'

/**
 * Middleware wrapper to check usage quota before processing request
 */
export async function withUsageCheck(
  req: NextRequest,
  metricType: MetricType,
  amount: number = 1,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get tenant ID from session
    const tenantId = (session.user as any).tenantId
    if (!tenantId) {
      // Try to get from user record
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: { tenant: true },
      })
      
      if (!user || !user.tenant) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        )
      }

      // Check quota
      const quotaCheck = await checkQuota(user.tenant.id, metricType, amount)
      if (!quotaCheck.allowed) {
        return NextResponse.json(
          { 
            error: quotaCheck.error || 'Quota exceeded',
            usage: quotaCheck.usage,
            limit: quotaCheck.limit,
          },
          { status: 403 }
        )
      }
    } else {
      // Check quota
      const quotaCheck = await checkQuota(tenantId, metricType, amount)
      if (!quotaCheck.allowed) {
        return NextResponse.json(
          { 
            error: quotaCheck.error || 'Quota exceeded',
            usage: quotaCheck.usage,
            limit: quotaCheck.limit,
          },
          { status: 403 }
        )
      }
    }

    // Proceed with handler
    return handler(req)
  } catch (error: any) {
    console.error('Usage middleware error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

