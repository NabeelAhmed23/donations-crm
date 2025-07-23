/*
  Warnings:

  - You are about to drop the column `amount` on the `donations` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `donations` table. All the data in the column will be lost.
  - You are about to drop the column `approvedBy` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `paidAt` on the `payments` table. All the data in the column will be lost.
  - Added the required column `name` to the `donations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentDate` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'DONATION_CREATED', 'DONATION_UPDATED', 'SYSTEM_ANNOUNCEMENT');

-- AlterTable
ALTER TABLE "donations" DROP COLUMN "amount",
DROP COLUMN "title",
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "paid" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "approvedBy",
DROP COLUMN "paidAt",
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "paymentDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address1" TEXT,
ADD COLUMN     "address2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "education" TEXT,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "state" TEXT;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_donations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "targetAmount" DECIMAL(65,30),
    "paid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_donations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_donations_userId_donationId_key" ON "user_donations"("userId", "donationId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_donations" ADD CONSTRAINT "user_donations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_donations" ADD CONSTRAINT "user_donations_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "donations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
