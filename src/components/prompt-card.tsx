"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PromptCard({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-3">
      <p className="text-sm font-medium text-muted-foreground">
        This week&apos;s prompt
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="h-8 px-3 text-xs font-medium"
      >
        {copied ? "Copied!" : "Copy prompt"}
      </Button>
    </div>
  );
}
