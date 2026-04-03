"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function WeekNavigator({
  currentWeek,
  availableWeeks,
}: {
  currentWeek: string;
  availableWeeks: string[];
}) {
  const router = useRouter();

  const currentIndex = availableWeeks.indexOf(currentWeek);
  const hasPrev = currentIndex < availableWeeks.length - 1;
  const hasNext = currentIndex > 0;

  function navigate(week: string) {
    router.push(`/?week=${week}`);
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => hasPrev && navigate(availableWeeks[currentIndex + 1])}
        disabled={!hasPrev}
        className="h-8 px-3 text-xs"
      >
        &larr; Prev
      </Button>
      <select
        value={currentWeek}
        onChange={(e) => navigate(e.target.value)}
        className="h-8 rounded-md border border-input bg-background px-3 text-sm"
      >
        {availableWeeks.map((w) => (
          <option key={w} value={w}>
            Week ending {w}
          </option>
        ))}
      </select>
      <Button
        variant="outline"
        size="sm"
        onClick={() => hasNext && navigate(availableWeeks[currentIndex - 1])}
        disabled={!hasNext}
        className="h-8 px-3 text-xs"
      >
        Next &rarr;
      </Button>
    </div>
  );
}
