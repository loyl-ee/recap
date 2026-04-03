import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SignOutButton } from "@/components/sign-out-button";
import { ConsolidatedRecapForm } from "@/components/consolidated-recap-form";
import { QuestionBuilderModal } from "@/components/question-builder-modal";
import { AdminModal } from "@/components/admin-modal";
import { WeekNavigator } from "@/components/week-navigator";
import { StoreHistoryModal } from "@/components/store-history-modal";
import { PatternFlag } from "@/components/pattern-flag";
import {
  getRmContext,
  getRmStores,
  getStoreRecapsForWeekParam,
  getRmConsolidatedRecap,
  getAdNotesForRm,
  generateConsolidationPrompt,
  getAllConsolidatedRecaps,
  getAvailableWeeks,
} from "@/app/actions/rm";
import { detectPatterns } from "@/lib/patterns";

function getCurrentWeekEnding(): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const d = new Date(now);
  d.setDate(now.getDate() + daysUntilSunday);
  return d.toISOString().split("T")[0];
}

export async function RmDashboard({ week }: { week?: string }) {
  const rmRecord = await getRmContext();
  const stores = await getRmStores(rmRecord.regionId);
  const storeIds = stores.map((s) => s.id);
  const availableWeeks = await getAvailableWeeks();

  const weekEnding = week || getCurrentWeekEnding();
  const isCurrentWeek = weekEnding === getCurrentWeekEnding();

  const [storeRecaps, consolidated, adNotes, allRmRecaps, consolidationPrompt] =
    await Promise.all([
      getStoreRecapsForWeekParam(storeIds, weekEnding),
      getRmConsolidatedRecap(rmRecord.id),
      getAdNotesForRm(rmRecord.id),
      getAllConsolidatedRecaps(weekEnding),
      isCurrentWeek ? generateConsolidationPrompt(rmRecord.id) : Promise.resolve(""),
    ]);

  // Detect cross-store patterns
  const patterns = detectPatterns(
    storeRecaps.map((r) => ({
      weekEnding: r.weekEnding,
      answers: r.answers,
    }))
  );

  // Build store status map
  const storeStatusMap = new Map(
    storeRecaps.map((r) => [r.storeId, r])
  );

  // Separate own vs other RMs' recaps
  const otherRmRecaps = allRmRecaps.filter((r) => r.rmId !== rmRecord.id);

  return (
    <main className="flex-1 px-8 py-8 max-w-6xl mx-auto w-full">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground mt-1">{rmRecord.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <QuestionBuilderModal rmId={rmRecord.id} stores={stores} />
          <AdminModal regionId={rmRecord.regionId} />
          <SignOutButton />
        </div>
      </header>

      {/* Week navigation */}
      <div className="mb-6">
        <WeekNavigator
          currentWeek={weekEnding}
          availableWeeks={
            availableWeeks.includes(weekEnding)
              ? availableWeeks
              : [weekEnding, ...availableWeeks]
          }
        />
      </div>

      {/* Cross-store pattern flags */}
      {patterns.length > 0 && (
        <div className="mb-6 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Recurring Themes This Week
          </p>
          {patterns.map((p) => (
            <PatternFlag key={p.theme} pattern={p} />
          ))}
        </div>
      )}

      {/* My Store Recaps */}
      <div className="mb-8">
        <h2 className="mb-4">My Stores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((s) => {
            const storeRecap = storeStatusMap.get(s.id);
            return (
              <StoreHistoryModal
                key={s.id}
                storeId={s.id}
                storeName={s.name}
              >
                <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{s.name}</CardTitle>
                      <Badge
                        variant={
                          storeRecap?.status === "submitted"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {storeRecap?.status ?? "pending"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {storeRecap ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          by {storeRecap.smName}
                        </p>
                        {storeRecap.answers.slice(0, 2).map((a, i) => (
                          <div key={i}>
                            <p className="text-xs font-medium text-muted-foreground">
                              {a.questionText}
                            </p>
                            <p className="text-sm line-clamp-2">
                              {a.answerText || "—"}
                            </p>
                          </div>
                        ))}
                        {storeRecap.answers.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{storeRecap.answers.length - 2} more answers
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No recap submitted yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </StoreHistoryModal>
            );
          })}
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Consolidated Recap + AD Notes */}
      {isCurrentWeek && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ConsolidatedRecapForm
            rmId={rmRecord.id}
            existingSummary={consolidated?.summary ?? ""}
            existingStatus={consolidated?.status ?? null}
            consolidationPrompt={consolidationPrompt}
            storeRecapIds={storeRecaps.map((r) => r.id)}
          />

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">AD Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {adNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No notes from your Area Director yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {adNotes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg bg-secondary/50 px-4 py-3"
                    >
                      <p className="text-sm">{note.noteText}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Other RMs' Recaps */}
      {otherRmRecaps.length > 0 && (
        <>
          <Separator className="mb-8" />
          <div className="mb-8">
            <h2 className="mb-4">Other Regional Managers</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {otherRmRecaps.map((r) => (
                <Card key={r.id} className="shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{r.rmName}</CardTitle>
                      <Badge
                        variant={
                          r.status === "submitted" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {r.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap line-clamp-6">
                      {r.summary || "No summary yet."}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
