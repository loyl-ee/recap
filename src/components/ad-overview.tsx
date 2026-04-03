import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SignOutButton } from "@/components/sign-out-button";
import { PromptCard } from "@/components/prompt-card";
import { AdNoteForm } from "@/components/ad-note-form";
import { AdMarketRecapForm } from "@/components/ad-market-recap-form";
import {
  getAdContext,
  getAdRms,
  getRmConsolidatedRecaps,
  generateAdPrompt,
} from "@/app/actions/ad";

export async function AdOverview() {
  const adRecord = await getAdContext();
  const rms = await getAdRms(adRecord.id);
  const rmIds = rms.map((r) => r.id);

  const [consolidated, adPrompt] = await Promise.all([
    getRmConsolidatedRecaps(rmIds),
    generateAdPrompt(adRecord.id),
  ]);

  const weekEnding = (() => {
    const now = new Date();
    const day = now.getDay();
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    const d = new Date(now);
    d.setDate(now.getDate() + daysUntilSunday);
    return d.toISOString().split("T")[0];
  })();

  // Map RM names for display
  const rmMap = new Map(rms.map((r) => [r.id, r]));
  const consolidatedMap = new Map(
    consolidated.map((c) => [c.rmId, c])
  );

  return (
    <main className="flex-1 px-8 py-8 max-w-6xl mx-auto w-full">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1>Market Overview</h1>
          <p className="text-muted-foreground mt-1">
            {adRecord.name} &mdash; Week ending {weekEnding}
          </p>
        </div>
        <SignOutButton />
      </header>

      {/* AD Prompt */}
      <div className="mb-6">
        <PromptCard prompt={adPrompt} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* RM Recaps */}
        <div className="lg:col-span-2 space-y-4">
          <h2>RM Recaps</h2>
          {rms.map((rmRecord) => {
            const c = consolidatedMap.get(rmRecord.id);
            return (
              <Card key={rmRecord.id} className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {rmRecord.name}
                    </CardTitle>
                    <Badge
                      variant={
                        c?.status === "submitted" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {c?.status ?? "pending"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {c ? (
                    <>
                      <p className="text-sm whitespace-pre-wrap">
                        {c.summary || "No summary written yet."}
                      </p>
                      {c.storeRecaps.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {c.storeRecaps.map((sr, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {sr.storeName}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Existing notes */}
                      {c.notes.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Your Notes
                          </p>
                          {c.notes.map((note) => (
                            <div
                              key={note.id}
                              className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2"
                            >
                              <p className="text-sm">{note.noteText}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(note.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add note */}
                      <AdNoteForm
                        adId={adRecord.id}
                        consolidatedRecapId={c.id}
                      />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No consolidated recap submitted yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {rms.length === 0 && (
            <p className="text-muted-foreground">
              No Regional Managers assigned yet.
            </p>
          )}
        </div>

        {/* AD Market Recap */}
        <div>
          <AdMarketRecapForm adId={adRecord.id} weekEnding={weekEnding} />
        </div>
      </div>
    </main>
  );
}
