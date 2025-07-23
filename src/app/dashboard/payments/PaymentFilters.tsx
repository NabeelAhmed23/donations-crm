"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface PaymentFiltersProps {
  filterStatus: string;
  setFilterStatus: (status: string) => void;
}

export default function PaymentFilters({
  filterStatus,
  setFilterStatus,
}: PaymentFiltersProps) {
  return (
    <div>
      <Label htmlFor="filterStatus">Filter by Status</Label>
      <Select
        value={filterStatus || "all"}
        onValueChange={(value) => setFilterStatus(value === "all" ? "" : value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="APPROVED">Approved</SelectItem>
          <SelectItem value="REJECTED">Rejected</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
