import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { checkQuota } from '@/lib/usage-tracker'

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  category: z.string().optional(),
  price: z.number().positive(),
  quantityInStock: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  imageUrl: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get tenant ID from session
    const tenantId = (session.user as any).tenantId
    
    // If no tenantId, try to get from user record
    let adminId = session.user.id

    if (!tenantId) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: { tenant: true },
      })
      
      if (user?.tenant) {
        // Get Admin record for this tenant
        const admin = await prisma.admin.findFirst({
          where: { tenantId: user.tenant.id },
        })
        if (admin) {
          adminId = admin.id
        } else if (session.user.role === 'CASHIER' && session.user.adminId) {
          adminId = session.user.adminId
        }
      } else if (session.user.role === 'CASHIER' && session.user.adminId) {
        adminId = session.user.adminId
      }
    } else {
      // Get Admin record for tenant
      const admin = await prisma.admin.findFirst({
        where: { tenantId },
      })
      if (admin) {
        adminId = admin.id
      }
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''

    const products = await prisma.product.findMany({
      where: {
        adminId: adminId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(category && { category }),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(products)
  } catch (error: any) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant ID from session
    const tenantId = (session.user as any).tenantId
    
    // If no tenantId in session, try to get from user record
    let finalTenantId = tenantId
    let adminId = session.user.id

    if (!finalTenantId) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: { tenant: true },
      })
      
      if (user?.tenant) {
        finalTenantId = user.tenant.id
      } else {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        )
      }
    }

    // Get or create Admin record for this tenant (for backward compatibility)
    let admin = await prisma.admin.findFirst({
      where: { tenantId: finalTenantId },
    })

    if (!admin) {
      // Create Admin record linked to tenant
      const tenant = await prisma.tenant.findUnique({
        where: { id: finalTenantId },
      })
      
      if (!tenant) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        )
      }

      admin = await prisma.admin.create({
        data: {
          businessName: tenant.name,
          email: tenant.email,
          password: '', // No password for email-only auth
          tenantId: finalTenantId,
        },
      })
    }

    adminId = admin.id

    // Check usage quota (checkQuota also increments usage)
    // Check subscription for grace period
    const subscription = await prisma.subscription.findUnique({
      where: { adminId },
      include: { plan: true }
    })

    const quotaCheck = await checkQuota(finalTenantId, 'PRODUCTS', 1)
    
    // If on free plan and at limit, check grace period
    if (!quotaCheck.allowed && subscription) {
      const isFreePlan = subscription.plan.name === 'FREE_TRIAL' || subscription.plan.price === 0
      const inGracePeriod = subscription.downgradeDate && 
        new Date().getTime() - new Date(subscription.downgradeDate).getTime() < 5 * 24 * 60 * 60 * 1000
      
      if (isFreePlan && inGracePeriod) {
        const daysLeft = Math.ceil((5 * 24 * 60 * 60 * 1000 - (new Date().getTime() - new Date(subscription.downgradeDate!).getTime())) / (24 * 60 * 60 * 1000))
        return NextResponse.json(
          { 
            error: `You have ${quotaCheck.usage} products. Free plan allows ${quotaCheck.limit}. You have ${daysLeft} days to choose which ${quotaCheck.limit} products to keep.`,
            usage: quotaCheck.usage,
            limit: quotaCheck.limit,
            inGracePeriod: true,
            daysLeft
          },
          { status: 403 }
        )
      }
    }
    
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { 
          error: quotaCheck.error || 'Free plan limit reached. Upgrade to continue.',
          usage: quotaCheck.usage,
          limit: quotaCheck.limit,
        },
        { status: 403 }
      )
    }

    const body = await req.json()
    const data = productSchema.parse(body)

    // Check for duplicate SKU if SKU is provided
    if (data.sku) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          adminId: adminId,
          sku: data.sku,
        },
      })

      if (existingProduct) {
        return NextResponse.json(
          { error: 'SKU already exists. Please use a different SKU.' },
          { status: 400 }
        )
      }
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        adminId: adminId,
      },
    })

    // Usage is already incremented in checkQuota above

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Product creation error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
