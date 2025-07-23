"use client";

import { Donation } from "@/types/donation";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface DonationFormData {
  name: string;
  description: string;
  type: "COMPULSORY" | "NON_COMPULSORY";
  targetAmount: string;
  dueDate: string;
  year: string;
  managerId: string;
}

export function useDonations(filterYear: string, filterType: string) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDonations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterYear) params.append("year", filterYear);
      if (filterType) params.append("type", filterType);

      const response = await fetch(`/api/donations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDonations(data);
      } else {
        toast.error("Failed to fetch donations");
      }
    } catch {
      toast.error("Error fetching donations");
    } finally {
      setLoading(false);
    }
  }, [filterYear, filterType]);

  const fetchManagers = async () => {
    try {
      const response = await fetch("/api/managers");
      if (response.ok) {
        const data = await response.json();
        setManagers(data);
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
    }
  };

  const createDonation = async (
    formData: DonationFormData
  ): Promise<boolean> => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        targetAmount: parseFloat(formData.targetAmount),
        dueDate: formData.dueDate,
        year: parseInt(formData.year),
        managerId: formData.managerId,
      };

      const response = await fetch("/api/donations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Donation created successfully");
        fetchDonations();
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create donation");
        return false;
      }
    } catch {
      toast.error("Error creating donation");
      return false;
    }
  };

  const updateDonation = async (
    id: string,
    formData: DonationFormData
  ): Promise<boolean> => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        targetAmount: parseFloat(formData.targetAmount),
        dueDate: formData.dueDate,
        year: parseInt(formData.year),
        managerId: formData.managerId,
      };

      const response = await fetch(`/api/donations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Donation updated successfully");
        fetchDonations();
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update donation");
        return false;
      }
    } catch {
      toast.error("Error updating donation");
      return false;
    }
  };

  const deleteDonation = async (donation: Donation): Promise<boolean> => {
    if (!confirm("Are you sure you want to delete this donation?")) {
      return false;
    }

    try {
      const response = await fetch(`/api/donations/${donation.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Donation deleted successfully");
        fetchDonations();
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete donation");
        return false;
      }
    } catch {
      toast.error("Error deleting donation");
      return false;
    }
  };

  useEffect(() => {
    fetchDonations();
    fetchManagers();
  }, [fetchDonations]);

  return {
    donations,
    managers,
    loading,
    createDonation,
    updateDonation,
    deleteDonation,
    refetchDonations: fetchDonations,
  };
}
