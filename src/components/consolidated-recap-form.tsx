"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveConsolidatedRecap } from "@/app/actions/rm";

export function ConsolidatedRecapForm({
  rmId,
  existingSummary,
  existingStatus,
  consolidationPrompt,
  storeRecapIds,
}: {
  rmId: string;
  existingSummary: string;
  existingStatus: string | null;
  consolidationPrompt: string;
  storeRecapIds: string[];
}) {
  const [summary, setSummary] = useState(existingSummary);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSubmitted = existingStatus === "submitted";

  function handleSave(status: "draft" | "submitted") {
    startTransition(async () => {
      await saveConsolidatedRecap(rmId, summary, status, storeRecapIds);
      setSaved(status === "draft" ? "Draft saved" : "Submitted!");
      setTimeout(() => setSaved(null), 2000);
    });
  }

  async function handleCopyPrompt() {
    await navigator.clipboard.writeText(consolidationPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">My Consolidated Recap</CardTitle>
        <div className="flex items-center gap-2">
          {existingStatus && (
            <Badge
              variant={isSubmitted ? "default" : "secondary"}
              className="text-xs"
            >
              {existingStatus}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrompt(!showPrompt)}
            className="text-xs h-8"
          >
            {showPrompt ? "Hide prompt" : "Show consolidation prompt"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPrompt}
            className="text-xs h-8"
          >
            {copied ? "Copied!" : "Copy prompt"}
          </Button>
        </div>

        {showPrompt && (
          <div className="rounded-lg border-2 border-dashed border-border bg-secondary/30 p-4">
            <pre className="whitespace-pre-wrap text-xs text-foreground/80 font-sans leading-relaxed max-h-64 overflow-y-auto">
              {consolidationPrompt}
            </pre>
          </div>
        )}

        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={8}
          placeholder="Write your consolidated regional recap here, or paste from your AI tool..."
          className="resize-y min-h-[120px]"
          disabled={isSubmitted}
        />

        {!isSubmitted && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => handleSave("draft")}
              disabled={isPending}
              className="h-11 px-6 font-semibold"
            >
              {isPending ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              onClick={() => handleSave("submitted")}
              disabled={isPending}
              className="h-11 px-6 font-semibold"
            >
              {isPending ? "Submitting..." : "Submit"}
            </Button>
            {saved && (
              <span className="text-sm text-muted-foreground">{saved}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
