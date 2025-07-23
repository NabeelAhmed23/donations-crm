import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('password123', 12)

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@donations.com' },
    update: {},
    create: {
      email: 'admin@donations.com',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@donations.com' },
    update: {},
    create: {
      email: 'manager@donations.com',
      firstName: 'Manager',
      lastName: 'User',
      password: hashedPassword,
      role: 'MANAGER',
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@donations.com' },
    update: {},
    create: {
      email: 'user@donations.com',
      firstName: 'Regular',
      lastName: 'User',
      password: hashedPassword,
      role: 'USER',
    },
  })

  // Create donations
  const donation1 = await prisma.donation.upsert({
    where: { id: 'donation-1' },
    update: {},
    create: {
      id: 'donation-1',
      name: 'Annual Fundraiser 2024',
      description: 'Help us raise funds for community projects',
      targetAmount: 5000,
      type: 'COMPULSORY',
      year: 2024,
      dueDate: new Date('2024-12-31'),
      managerId: manager.id,
    },
  })

  const donation2 = await prisma.donation.upsert({
    where: { id: 'donation-2' },
    update: {},
    create: {
      id: 'donation-2',
      name: 'Holiday Charity Drive',
      description: 'Support families during the holiday season',
      targetAmount: 2500,
      type: 'NON_COMPULSORY',
      year: 2024,
      dueDate: new Date('2024-12-25'),
      managerId: manager.id,
    },
  })

  // Create sample payments
  await prisma.payment.upsert({
    where: { id: 'payment-1' },
    update: {},
    create: {
      id: 'payment-1',
      amount: 500,
      paymentDate: new Date('2024-01-15'),
      description: 'First installment',
      donationId: donation1.id,
      userId: user.id,
      status: 'APPROVED',
      approvedById: manager.id,
      approvedAt: new Date('2024-01-16'),
    },
  })

  await prisma.payment.upsert({
    where: { id: 'payment-2' },
    update: {},
    create: {
      id: 'payment-2',
      amount: 250,
      paymentDate: new Date('2024-01-20'),
      description: 'Voluntary contribution',
      donationId: donation2.id,
      userId: user.id,
      status: 'PENDING',
    },
  })

  console.log('Database has been seeded! 🌱')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })