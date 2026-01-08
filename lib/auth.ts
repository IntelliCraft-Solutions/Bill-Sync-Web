import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'text' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error('Email is required')
        }

        // For OTP-based login, verify OTP was already verified via /api/auth/verify-login
        // This provider is called after OTP verification
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { tenant: true },
        })

        if (!user || !user.tenant) {
          throw new Error('User not found')
        }

        if (!user.emailVerified) {
          throw new Error('Email not verified')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.tenant.name,
          role: 'ADMIN',
          tenantId: user.tenant.id,
        }
      },
    }),
    // Legacy password-based auth (for backward compatibility)
    CredentialsProvider({
      id: 'legacy',
      name: 'Legacy Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        employeeId: { label: 'Employee ID', type: 'text' },
        userType: { label: 'User Type', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.userType) {
          throw new Error('Missing credentials')
        }

        if (credentials.userType === 'admin') {
          try {
            const admin = await prisma.admin.findUnique({
              where: { email: credentials.email.trim().toLowerCase() },
            })

            if (!admin) {
              throw new Error('Invalid credentials')
            }

            // Check if admin has a password set (not empty)
            if (!admin.password || admin.password.trim() === '') {
              throw new Error('Password not set. Please use email-based login or contact support to set a password.')
            }

            // Trim password input and compare
            const trimmedPassword = credentials.password.trim()
            if (!trimmedPassword) {
              throw new Error('Password is required')
            }

            // Verify password with bcrypt
            const isPasswordValid = await bcrypt.compare(trimmedPassword, admin.password)

            if (!isPasswordValid) {
              throw new Error('Invalid credentials')
            }

            return {
              id: admin.id,
              email: admin.email,
              name: admin.businessName,
              role: 'ADMIN',
            }
          } catch (error: any) {
            // Handle database errors gracefully
            if (error.message?.includes('FATAL') || error.message?.includes('database')) {
              console.error('Database error during admin login:', error)
              throw new Error('Database connection error. Please try again or contact support.')
            }
            throw error
          }
        } else if (credentials.userType === 'cashier') {
          // Require employeeId for cashier login
          if (!credentials.employeeId || !credentials.employeeId.trim()) {
            throw new Error('Employee ID is required')
          }

          // Trim and normalize inputs
          const trimmedUsername = credentials.email.trim()
          const trimmedEmployeeId = credentials.employeeId.trim().toUpperCase()
          const trimmedPassword = credentials.password.trim()

          if (!trimmedPassword) {
            throw new Error('Password is required')
          }

          const cashier = await prisma.billingAccount.findUnique({
            where: { username: trimmedUsername },
            include: { admin: true },
          })

          if (!cashier) {
            throw new Error('Invalid credentials')
          }

          // Verify employeeId matches
          if (!cashier.employeeId || cashier.employeeId !== trimmedEmployeeId) {
            throw new Error('Invalid credentials')
          }

          // Verify password with bcrypt
          const isPasswordValid = await bcrypt.compare(trimmedPassword, cashier.password)

          if (!isPasswordValid) {
            throw new Error('Invalid credentials')
          }

          return {
            id: cashier.id,
            email: cashier.username,
            name: cashier.username,
            role: 'CASHIER',
            adminId: cashier.adminId,
          }
        }

        throw new Error('Invalid user type')
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.adminId = user.adminId
        token.tenantId = (user as any).tenantId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.sub as string
        session.user.adminId = token.adminId as string
        session.user.tenantId = token.tenantId as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
