import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        userType: { label: 'User Type', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.userType) {
          throw new Error('Missing credentials')
        }

        if (credentials.userType === 'admin') {
          const admin = await prisma.admin.findUnique({
            where: { email: credentials.email },
          })

          if (!admin) {
            throw new Error('Invalid credentials')
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, admin.password)

          if (!isPasswordValid) {
            throw new Error('Invalid credentials')
          }

          return {
            id: admin.id,
            email: admin.email,
            name: admin.businessName,
            role: 'ADMIN',
          }
        } else if (credentials.userType === 'cashier') {
          const cashier = await prisma.billingAccount.findUnique({
            where: { username: credentials.email },
            include: { admin: true },
          })

          if (!cashier) {
            throw new Error('Invalid credentials')
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, cashier.password)

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
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.sub as string
        session.user.adminId = token.adminId as string
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
