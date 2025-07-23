"use client";

interface DonationProgressBarProps {
  totalPaid: number;
  targetAmount: number;
  className?: string;
}

export default function DonationProgressBar({
  totalPaid,
  targetAmount,
  className = "",
}: DonationProgressBarProps) {
  const getProgressPercentage = () => {
    return Math.min((totalPaid / targetAmount) * 100, 100);
  };

  const progressPercentage = getProgressPercentage();

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between text-sm">
        <span>${totalPaid.toFixed(2)}</span>
        <span>{progressPercentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Paid</span>
        <span>Target: ${targetAmount.toFixed(2)}</span>
      </div>
    </div>
  );
}