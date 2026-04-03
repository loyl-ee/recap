import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NoteWithContext = {
  note: { id: string; noteText: string; createdAt: Date };
  storeName: string;
  smName: string;
};

export function RmNoteSummary({ notes }: { notes: NoteWithContext[] }) {
  // Group by store
  const byStore = new Map<string, NoteWithContext[]>();
  for (const n of notes) {
    const existing = byStore.get(n.storeName) || [];
    existing.push(n);
    byStore.set(n.storeName, existing);
  }

  return (
    <Card className="shadow-sm mb-8">
      <CardHeader>
        <CardTitle className="text-lg">My Notes This Week</CardTitle>
        <p className="text-xs text-muted-foreground">
          Collected from your store reviews — use these to write your consolidated recap.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from(byStore.entries()).map(([storeName, storeNotes]) => (
            <div key={storeName}>
              <p className="text-sm font-semibold mb-1">{storeName}</p>
              <ul className="space-y-1">
                {storeNotes.map((n) => (
                  <li
                    key={n.note.id}
                    className="text-sm text-muted-foreground pl-3 border-l-2 border-border"
                  >
                    {n.note.noteText}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
