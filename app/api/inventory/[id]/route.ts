import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  category: z.string().optional(),
  price: z.number().positive(),
  quantityInStock: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0),
  imageUrl: z.string().optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = productSchema.parse(body)

    // Check for duplicate SKU if SKU is provided
    if (data.sku) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          adminId: session.user.id,
          sku: data.sku,
          NOT: { id: params.id }, // Exclude the current product being updated
        },
      })

      if (existingProduct) {
        return NextResponse.json(
          { error: 'SKU already exists. Please use a different SKU.' },
          { status: 400 }
        )
      }
    }

    const product = await prisma.product.update({
      where: {
        id: params.id,
        adminId: session.user.id,
      },
      data,
    })

    return NextResponse.json(product)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.product.delete({
      where: {
        id: params.id,
        adminId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
