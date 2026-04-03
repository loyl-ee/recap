"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PromptCard({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border-dashed border-2 border-border bg-secondary/30 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold text-muted-foreground">
          Your Prompt
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-8 px-3 text-xs font-medium"
        >
          {copied ? "Copied!" : "Copy prompt"}
        </Button>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap text-sm text-foreground/80 font-sans leading-relaxed">
          {prompt}
        </pre>
      </CardContent>
    </Card>
  );
}
