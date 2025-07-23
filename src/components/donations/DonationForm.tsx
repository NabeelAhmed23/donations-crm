"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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

interface DonationFormProps {
  formData: DonationFormData;
  setFormData: (data: DonationFormData) => void;
  managers: Manager[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
  loading?: boolean;
}

export default function DonationForm({
  formData,
  setFormData,
  managers,
  onSubmit,
  onCancel,
  isEditing,
  loading = false,
}: DonationFormProps) {
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Edit Donation" : "Create New Donation"}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="type">Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "COMPULSORY" | "NON_COMPULSORY") =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPULSORY">Compulsory</SelectItem>
                <SelectItem value="NON_COMPULSORY">Non-Compulsory</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="targetAmount">Target Amount ($) *</Label>
            <Input
              id="targetAmount"
              type="number"
              step="0.01"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="year">Year *</Label>
            <Input
              id="year"
              type="number"
              min="2020"
              max="2030"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="managerId">Manager *</Label>
            <Select
              value={formData.managerId}
              onValueChange={(value) => setFormData({ ...formData, managerId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.firstName} {manager.lastName} ({manager.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}