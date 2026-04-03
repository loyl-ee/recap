"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStoreRecapHistory } from "@/app/actions/rm";

type RecapWithAnswers = {
  id: string;
  weekEnding: string;
  status: string;
  smName: string;
  storeName: string;
  answers: { questionText: string; answerText: string | null }[];
};

export function StoreHistoryModal({
  storeId,
  storeName,
  children,
}: {
  storeId: string;
  storeName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [recaps, setRecaps] = useState<RecapWithAnswers[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      startTransition(async () => {
        const history = await getStoreRecapHistory(storeId);
        setRecaps(history as RecapWithAnswers[]);
      });
    }
  }, [open, storeId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<button className="w-full text-left" />}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{storeName} — Recap History</DialogTitle>
        </DialogHeader>

        {isPending ? (
          <p className="text-sm text-muted-foreground py-4">Loading...</p>
        ) : recaps.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No recap history.</p>
        ) : (
          <div className="space-y-4 pt-2">
            {recaps.map((r) => (
              <Card key={r.id} className="shadow-none border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      Week ending {r.weekEnding}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {r.smName}
                      </span>
                      <Badge
                        variant={
                          r.status === "submitted" ? "default" : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {r.answers.map((a, i) => (
                    <div key={i}>
                      <p className="text-xs font-medium text-muted-foreground">
                        {a.questionText}
                      </p>
                      <p className="text-sm">{a.answerText || "—"}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
