import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PastRecap = {
  id: string;
  weekEnding: string;
  status: string;
  answers: { questionText: string; answerText: string | null }[];
};

export function PastRecapsList({ recaps }: { recaps: PastRecap[] }) {
  if (recaps.length === 0) {
    return <p className="text-muted-foreground">No past recaps yet.</p>;
  }

  return (
    <div className="space-y-4">
      {recaps.map((r) => (
        <Card key={r.id} className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Week ending {r.weekEnding}
              </CardTitle>
              <Badge
                variant={r.status === "submitted" ? "default" : "secondary"}
                className="text-xs"
              >
                {r.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {r.answers.map((a, i) => (
              <div key={i}>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {a.questionText}
                </p>
                <p className="text-sm">{a.answerText || "\u2014"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
