"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { saveAdRecap } from "@/app/actions/ad";

export function AdMarketRecapForm({
  adId,
  weekEnding,
  existingSummary,
}: {
  adId: string;
  weekEnding: string;
  existingSummary: string;
}) {
  const [summary, setSummary] = useState(existingSummary);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleCopy() {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSave() {
    startTransition(async () => {
      await saveAdRecap(adId, summary);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">My Market Recap</CardTitle>
        <p className="text-xs text-muted-foreground">
          5-minute overview for week ending {weekEnding}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={12}
          placeholder="Write your market overview here or paste from your AI tool..."
          className="resize-y min-h-[200px] text-sm"
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={isPending || !summary.trim()}
            size="sm"
            className="h-9 text-xs font-semibold"
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!summary.trim()}
            className="h-9 text-xs font-medium"
          >
            {copied ? "Copied!" : "Copy recap"}
          </Button>
          {saved && (
            <span className="text-xs text-muted-foreground">Saved</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
