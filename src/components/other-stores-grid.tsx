import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StoreHistoryModal } from "@/components/store-history-modal";

type StoreInfo = { id: string; name: string };
type StoreRecap = {
  id: string;
  storeId: string;
  status: string;
  smName: string;
  storeName: string;
  answers: { questionText: string; answerText: string | null }[];
};

export function OtherStoresGrid({
  stores,
  recapsByStore,
}: {
  stores: StoreInfo[];
  recapsByStore: Map<string, StoreRecap>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {stores.map((s) => {
        const recap = recapsByStore.get(s.id);
        return (
          <StoreHistoryModal key={s.id} storeId={s.id} storeName={s.name}>
            <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{s.name}</CardTitle>
                  <Badge
                    variant={
                      recap?.status === "submitted" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {recap?.status ?? "pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {recap ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      by {recap.smName}
                    </p>
                    {recap.answers.slice(0, 1).map((a, i) => (
                      <div key={i}>
                        <p className="text-xs font-medium text-muted-foreground">
                          {a.questionText}
                        </p>
                        <p className="text-sm line-clamp-2">
                          {a.answerText || "\u2014"}
                        </p>
                      </div>
                    ))}
                    {recap.answers.length > 1 && (
                      <p className="text-xs text-muted-foreground">
                        +{recap.answers.length - 1} more answers
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No recap this week
                  </p>
                )}
              </CardContent>
            </Card>
          </StoreHistoryModal>
        );
      })}
    </div>
  );
}
