import { db } from "@/db";
import { rm } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SignOutButton } from "@/components/sign-out-button";
import { PromptCard } from "@/components/prompt-card";
import { RecapForm } from "@/components/recap-form";
import { StoreHistoryModal } from "@/components/store-history-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getSmContext,
  getTemplateQuestions,
  getCurrentRecap,
  getRecapAnswers,
  getPastRecaps,
  getPromptRules,
  getOtherStoreRecaps,
  getRegionStores,
} from "@/app/actions/recap";
import { generatePrompt } from "@/lib/prompts";
import { detectPatterns } from "@/lib/patterns";

export async function SmView() {
  const { sm: smRecord, store: storeRecord } = await getSmContext();

  // Find the RM for this store's region to get prompt rules
  const [rmRecord] = await db
    .select()
    .from(rm)
    .where(eq(rm.regionId, storeRecord.regionId))
    .limit(1);

  // Load all data in parallel
  const [questions, currentRecap, pastRecaps, rules, otherRecaps, regionStores] =
    await Promise.all([
      getTemplateQuestions(storeRecord.id, smRecord.id),
      getCurrentRecap(smRecord.id, storeRecord.id),
      getPastRecaps(smRecord.id),
      rmRecord ? getPromptRules(rmRecord.id) : Promise.resolve([]),
      getOtherStoreRecaps(storeRecord.regionId, storeRecord.id),
      getRegionStores(storeRecord.regionId),
    ]);

  // Get existing answers if there's a current recap
  const existingAnswers = currentRecap
    ? await getRecapAnswers(currentRecap.id)
    : [];

  // Detect patterns from past recaps
  const patterns = detectPatterns(pastRecaps);

  // Generate the prompt
  const weekEnding = new Date();
  const day = weekEnding.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  weekEnding.setDate(weekEnding.getDate() + daysUntilSunday);
  const weekEndingStr = weekEnding.toISOString().split("T")[0];

  const prompt = generatePrompt(
    storeRecord.name,
    weekEndingStr,
    questions,
    rules,
    patterns
  );

  // Group other recaps by store
  const otherRecapsByStore = new Map<
    string,
    (typeof otherRecaps)[number]
  >();
  for (const r of otherRecaps) {
    otherRecapsByStore.set(r.storeId, r);
  }

  // Other stores (excluding mine)
  const otherStores = regionStores.filter((s) => s.id !== storeRecord.id);

  return (
    <main className="flex-1 px-8 py-8 max-w-4xl mx-auto w-full">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1>My Recap</h1>
          <p className="text-muted-foreground mt-1">
            {storeRecord.name} &mdash; Week ending {weekEndingStr}
          </p>
        </div>
        <SignOutButton />
      </header>

      {/* Prompt copy bar */}
      <div className="mb-6">
        <PromptCard prompt={prompt} />
      </div>

      {/* Recap entry form */}
      <div className="mb-10">
        <RecapForm
          smId={smRecord.id}
          storeId={storeRecord.id}
          questions={questions}
          existingAnswers={existingAnswers.map((a) => ({
            questionId: a.questionId,
            answerText: a.answerText,
          }))}
          currentStatus={currentRecap?.status ?? null}
        />
      </div>

      {/* Past recaps */}
      <Separator className="mb-8" />
      <div className="mb-10">
        <h2 className="mb-4">My Past Recaps</h2>
        {pastRecaps.length === 0 ? (
          <p className="text-muted-foreground">No past recaps yet.</p>
        ) : (
          <div className="space-y-4">
            {pastRecaps.map((r) => (
              <Card key={r.id} className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Week ending {r.weekEnding}
                    </CardTitle>
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
                <CardContent className="space-y-3">
                  {r.answers.map((a, i) => (
                    <div key={i}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
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
      </div>

      {/* Other stores */}
      <Separator className="mb-8" />
      <div>
        <h2 className="mb-4">Other Stores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otherStores.map((s) => {
            const otherRecap = otherRecapsByStore.get(s.id);
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
                          otherRecap?.status === "submitted"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {otherRecap?.status ?? "pending"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {otherRecap ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          by {otherRecap.smName}
                        </p>
                        {otherRecap.answers.slice(0, 1).map((a, i) => (
                          <div key={i}>
                            <p className="text-xs font-medium text-muted-foreground">
                              {a.questionText}
                            </p>
                            <p className="text-sm line-clamp-2">
                              {a.answerText || "—"}
                            </p>
                          </div>
                        ))}
                        {otherRecap.answers.length > 1 && (
                          <p className="text-xs text-muted-foreground">
                            +{otherRecap.answers.length - 1} more answers
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
      </div>
    </main>
  );
}
