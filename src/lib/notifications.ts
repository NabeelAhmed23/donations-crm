import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type NotificationType =
  | "PAYMENT_APPROVED"
  | "PAYMENT_REJECTED"
  | "DONATION_CREATED"
  | "DONATION_UPDATED"
  | "SYSTEM_ANNOUNCEMENT";

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
}

export async function createNotification(data: CreateNotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data:
          data.data === undefined || data.data === null
            ? Prisma.JsonNull
            : (data.data as Prisma.InputJsonValue),
      },
    });

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
}

export async function createPaymentNotification(
  userId: string,
  paymentId: string,
  status: "APPROVED" | "REJECTED",
  amount: number,
  donationName: string,
  approverName: string,
  notes?: string
) {
  const isApproved = status === "APPROVED";

  return createNotification({
    userId,
    type: isApproved ? "PAYMENT_APPROVED" : "PAYMENT_REJECTED",
    title: `Payment ${isApproved ? "Approved" : "Rejected"}`,
    message: `Your payment of Rs ${amount.toLocaleString()} for "${donationName}" has been ${
      isApproved ? "approved" : "rejected"
    } by ${approverName}${notes ? `. Note: ${notes}` : ""}`,
    data: {
      paymentId,
      amount,
      donationName,
      status,
      approverName,
      notes,
    },
  });
}
