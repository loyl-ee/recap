import { Badge } from "@/components/ui/badge";
import type { PatternFlag as PatternFlagType } from "@/lib/patterns";

export function PatternFlag({ pattern }: { pattern: PatternFlagType }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
      <Badge
        variant="destructive"
        className="mt-0.5 shrink-0 text-xs font-semibold"
      >
        {pattern.occurrences}x
      </Badge>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">
          {pattern.theme}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Mentioned in {pattern.occurrences} of the last {pattern.weeks.length}{" "}
          weeks ({pattern.weeks.join(", ")})
        </p>
      </div>
    </div>
  );
}
