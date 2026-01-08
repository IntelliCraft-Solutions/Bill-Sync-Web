import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateEmail } from '@/lib/email-validation'
import { generateOTP, hashOTP, getOTPExpiry } from '@/lib/otp'
import { sendOTPEmail } from '@/lib/email'
import { createTenantSchema } from '@/lib/tenant-schema'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name } = body

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    // Validate email format and deliverability
    const emailValidation = await validateEmail(email)
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error || "The email isn't valid — please use a valid email address." },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Generate tenant ID and schema name
    const tenantId = randomUUID()
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50)

    // Create user and tenant in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          emailVerified: false,
        },
      })

      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          id: tenantId,
          userId: user.id,
          name,
          slug,
          schemaName,
          email,
          plan: 'free',
          paid: false,
          metadata: {},
        },
      })

      // Link user to tenant
      await tx.user.update({
        where: { id: user.id },
        data: { tenantId: tenant.id },
      })

      return { user, tenant }
    })

    // Generate and store OTP
    const otp = generateOTP()
    const hashedOTP = await hashOTP(otp)
    const expiresAt = getOTPExpiry()

    await prisma.emailOTP.create({
      data: {
        tenantId: result.tenant.id,
        email,
        otp: hashedOTP,
        type: 'verification',
        expiresAt,
      },
    })

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, 'verification')
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError)
      // Don't fail registration if email fails, but log it
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email for verification code.',
      tenantId: result.tenant.id,
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
