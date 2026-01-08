import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOTPEmail } from '@/lib/email'
import { hashOTP } from '@/lib/otp'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find admin by email
    let admin
    try {
      admin = await prisma.admin.findUnique({
        where: { email: email.trim().toLowerCase() },
      })
    } catch (dbError: any) {
      console.error('Database error in forgot password:', dbError)
      // Handle database errors gracefully
      if (dbError.message?.includes('FATAL') || dbError.message?.includes('database')) {
        return NextResponse.json(
          { error: 'Database connection error. Please try again or contact support.' },
          { status: 500 }
        )
      }
      throw dbError
    }

    if (!admin) {
      // Don't reveal if email exists for security
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, an OTP has been sent.',
      })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Hash and store OTP
    const hashedOTP = await hashOTP(otp)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Get or create tenant ID for the admin
    let tenantId = admin.tenantId

    if (!tenantId) {
      try {
        // Find or create tenant for this admin
        // First, try to find a tenant by email
        let tenant = await prisma.tenant.findFirst({
          where: { email: admin.email },
        })

        if (!tenant) {
          // Create a new tenant for this admin
          const user = await prisma.user.findFirst({
            where: { email: admin.email },
          })

          if (user && user.tenantId) {
            tenantId = user.tenantId
          } else {
            // Create user and tenant if they don't exist
            const newUser = await prisma.user.create({
              data: {
                email: admin.email,
                emailVerified: true,
              },
            })

            tenant = await prisma.tenant.create({
              data: {
                userId: newUser.id,
                name: admin.businessName,
                slug: admin.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
                schemaName: `tenant_${newUser.id.slice(0, 8)}`,
                email: admin.email,
                plan: 'free',
              },
            })

            await prisma.user.update({
              where: { id: newUser.id },
              data: { tenantId: tenant.id },
            })

            tenantId = tenant.id

            // Update admin with tenantId
            await prisma.admin.update({
              where: { id: admin.id },
              data: { tenantId },
            })
          }
        } else {
          tenantId = tenant.id
          // Update admin with tenantId
          await prisma.admin.update({
            where: { id: admin.id },
            data: { tenantId },
          })
        }
      } catch (tenantError: any) {
        console.error('Error creating/finding tenant:', tenantError)
        // If tenant creation fails, we can still proceed with a simpler approach
        // Store OTP without tenant (but this won't work with current schema)
        // For now, return an error
        return NextResponse.json(
          { error: 'Account setup error. Please contact support.' },
          { status: 500 }
        )
      }
    }

    // Store OTP in database
    try {
      await prisma.emailOTP.create({
        data: {
          tenantId: tenantId!,
          email: admin.email,
          otp: hashedOTP,
          type: 'password_reset',
          expiresAt,
          used: false,
        },
      })
    } catch (otpError: any) {
      console.error('Error storing OTP:', otpError)
      if (otpError.message?.includes('FATAL') || otpError.message?.includes('database')) {
        return NextResponse.json(
          { error: 'Database connection error. Please try again or contact support.' },
          { status: 500 }
        )
      }
      throw otpError
    }

    // Send OTP email
    try {
      await sendOTPEmail(admin.email, otp, 'verification')
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'OTP has been sent to your email address.',
    })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

