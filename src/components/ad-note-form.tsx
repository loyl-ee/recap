"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveAdNote } from "@/app/actions/ad";

export function AdNoteForm({
  adId,
  consolidatedRecapId,
}: {
  adId: string;
  consolidatedRecapId: string;
}) {
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit() {
    if (!note.trim()) return;
    startTransition(async () => {
      await saveAdNote(adId, consolidatedRecapId, note.trim());
      setNote("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="flex gap-2 mt-3">
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Leave a note for this RM..."
        className="h-9 text-sm"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={isPending || !note.trim()}
        className="h-9 shrink-0"
      >
        {saved ? "Sent!" : "Add Note"}
      </Button>
    </div>
  );
}
