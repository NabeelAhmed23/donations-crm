import NextAuth from 'next-auth'
import authConfig from './auth-edge.config'

export const { auth } = NextAuth(authConfig)