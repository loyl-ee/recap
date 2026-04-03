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
    <div className="rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-3">
      <p className="text-sm text-muted-foreground">
        Need help writing your recap?{" "}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-3 text-xs font-semibold mx-1 inline-flex"
        >
          {copied ? "Copied!" : "Copy your prompt"}
        </Button>{" "}
        and paste it into your AI tool to get started.
      </p>
    </div>
  );
}
