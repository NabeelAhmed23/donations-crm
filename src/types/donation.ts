import { UserDonation } from "@prisma/client";

export interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface Donation {
  id: string;
  name: string;
  description?: string;
  type: "COMPULSORY" | "NON_COMPULSORY";
  totalPaid: number;
  remainingAmount: number;
  dueDate: string;
  year: number;
  manager: Manager;
  createdAt: string;
  paid: boolean;
  _count: {
    payments: number;
  };
  userDonations: UserDonation[];
}
