import NextAuth from 'next-auth'
import authConfig from './auth.config'

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig)

// Keep the password hashing utilities for registration
export { hashPassword, verifyPassword } from './auth-utils'