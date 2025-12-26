import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendWelcomeEmail } from '@/lib/mail'

const ALLOWED_DOMAINS = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com', 'protonmail.com']

const registerSchema = z.object({
  businessName: z.string().min(1),
  email: z.string().email().refine((email) => {
    const domain = email.split('@')[1].toLowerCase()
    return ALLOWED_DOMAINS.includes(domain)
  }, {
    message: 'Please use a valid personal email account (Gmail, Outlook, Yahoo, etc.)'
  }),
  password: z.string().min(6),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { businessName, email, password } = registerSchema.parse(body)

    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const admin = await prisma.$transaction(async (tx) => {
      const newAdmin = await tx.admin.create({
        data: {
          businessName,
          email,
          password: hashedPassword,
          storeDetails: {
            create: {
              storeName: businessName,
            }
          }
        },
      })

      const standardPlan = await tx.subscriptionPlan.findFirst({
        where: { name: 'STANDARD' }
      })

      if (standardPlan) {
        await tx.subscription.create({
          data: {
            adminId: newAdmin.id,
            planId: standardPlan.id,
            status: 'ACTIVE',
            startDate: new Date(),
          }
        })
      }

      return newAdmin
    })

    // Send welcome email asynchronously
    sendWelcomeEmail(email, businessName).catch(console.error)

    return NextResponse.json({
      id: admin.id,
      businessName: admin.businessName,
      email: admin.email,
      message: 'Account created successfully! A welcome email has been sent.'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
