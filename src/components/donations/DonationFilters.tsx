"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DonationFiltersProps {
  filterYear: string;
  filterType: string;
  onYearChange: (year: string) => void;
  onTypeChange: (type: string) => void;
}

export default function DonationFilters({
  filterYear,
  filterType,
  onYearChange,
  onTypeChange,
}: DonationFiltersProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  const handleYearChange = (value: string) => {
    onYearChange(value === "all" ? "" : value);
  };

  const handleTypeChange = (value: string) => {
    onTypeChange(value === "all" ? "" : value);
  };

  return (
    <div className="flex space-x-4">
      <div>
        <Label htmlFor="filterYear">Filter by Year</Label>
        <Select value={filterYear || "all"} onValueChange={handleYearChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="filterType">Filter by Type</Label>
        <Select value={filterType || "all"} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="COMPULSORY">Compulsory</SelectItem>
            <SelectItem value="NON_COMPULSORY">Non-Compulsory</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}