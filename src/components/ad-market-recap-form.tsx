"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function AdMarketRecapForm({
  adId,
  weekEnding,
}: {
  adId: string;
  weekEnding: string;
}) {
  const [recap, setRecap] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(recap);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          value={recap}
          onChange={(e) => setRecap(e.target.value)}
          rows={12}
          placeholder="Write your market overview here or paste from your AI tool..."
          className="resize-y min-h-[200px] text-sm"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!recap.trim()}
            className="h-9 text-xs font-medium"
          >
            {copied ? "Copied!" : "Copy recap"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
