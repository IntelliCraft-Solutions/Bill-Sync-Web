import 'next-auth'

declare module 'next-auth' {
  interface User {
    role?: string
    adminId?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      adminId?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    adminId?: string
  }
}
