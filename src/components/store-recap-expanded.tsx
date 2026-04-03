"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  saveRmNote,
  saveRmSmNote,
  getRmNotesForRecap,
  getRmSmNotesForRecap,
  deleteRmNote,
} from "@/app/actions/rm";

type StoreRecap = {
  id: string;
  weekEnding: string;
  status: string;
  smName: string;
  storeName: string;
  answers: { questionText: string; answerText: string | null }[];
};

type Note = { id: string; noteText: string; createdAt: Date };

export function StoreRecapExpanded({
  rmId,
  recap,
  children,
}: {
  rmId: string;
  recap: StoreRecap;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [myNotes, setMyNotes] = useState<Note[]>([]);
  const [smNotes, setSmNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [newSmNote, setNewSmNote] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      loadNotes();
    }
  }, [open]);

  async function loadNotes() {
    const [mine, toSm] = await Promise.all([
      getRmNotesForRecap(recap.id),
      getRmSmNotesForRecap(recap.id),
    ]);
    setMyNotes(mine as Note[]);
    setSmNotes(toSm as Note[]);
  }

  function handleAddNote() {
    if (!newNote.trim()) return;
    startTransition(async () => {
      await saveRmNote(rmId, recap.id, newNote.trim());
      setNewNote("");
      await loadNotes();
    });
  }

  function handleAddSmNote() {
    if (!newSmNote.trim()) return;
    startTransition(async () => {
      await saveRmSmNote(rmId, recap.id, newSmNote.trim());
      setNewSmNote("");
      await loadNotes();
    });
  }

  function handleDeleteNote(noteId: string) {
    startTransition(async () => {
      await deleteRmNote(noteId);
      await loadNotes();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<button className="w-full text-left" />}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{recap.storeName}</DialogTitle>
            <Badge
              variant={recap.status === "submitted" ? "default" : "secondary"}
              className="text-xs"
            >
              {recap.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {recap.smName} &mdash; Week ending {recap.weekEnding}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Left: recap answers */}
          <div className="space-y-4">
            {recap.answers.map((a, i) => (
              <div key={i}>
                <p className="text-xs font-semibold text-muted-foreground">
                  {a.questionText}
                </p>
                <p className="text-sm mt-1">{a.answerText || "—"}</p>
              </div>
            ))}
          </div>

          {/* Right: notes */}
          <div className="space-y-4">
            {/* My notes (private, for consolidation) */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                My Notes
              </p>
              <div className="space-y-2">
                {myNotes.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-2 rounded-md bg-secondary/50 px-3 py-2"
                  >
                    <p className="text-sm flex-1">{n.noteText}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(n.id)}
                      disabled={isPending}
                      className="h-5 px-1 text-[10px] text-muted-foreground hover:text-destructive shrink-0"
                    >
                      x
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Jot a note for yourself..."
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddNote}
                  disabled={isPending || !newNote.trim()}
                  className="h-8 text-xs shrink-0"
                >
                  Add
                </Button>
              </div>
            </div>

            <Separator />

            {/* Note to SM (visible to them) */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Note to {recap.smName.split(" ")[0]}
              </p>
              <div className="space-y-2">
                {smNotes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-md bg-primary/5 border border-primary/10 px-3 py-2"
                  >
                    <p className="text-sm">{n.noteText}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newSmNote}
                  onChange={(e) => setNewSmNote(e.target.value)}
                  placeholder={`Leave feedback for ${recap.smName.split(" ")[0]}...`}
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSmNote();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleAddSmNote}
                  disabled={isPending || !newSmNote.trim()}
                  className="h-8 text-xs shrink-0"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
