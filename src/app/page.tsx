import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SmView } from "@/components/sm-view";
import { RmDashboard } from "@/components/rm-dashboard";
import { AdOverview } from "@/components/ad-overview";
import { db } from "@/db";
import { sm, rm, ad } from "@/db/schema";
import { eq } from "drizzle-orm";

async function entityExists(role: string, entityId: string): Promise<boolean> {
  if (role === "sm") {
    const [found] = await db.select({ id: sm.id }).from(sm).where(eq(sm.id, entityId)).limit(1);
    return !!found;
  }
  if (role === "rm") {
    const [found] = await db.select({ id: rm.id }).from(rm).where(eq(rm.id, entityId)).limit(1);
    return !!found;
  }
  if (role === "ad") {
    const [found] = await db.select({ id: ad.id }).from(ad).where(eq(ad.id, entityId)).limit(1);
    return !!found;
  }
  return false;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role, entityId } = session.user as {
    role: "sm" | "rm" | "ad";
    entityId: string;
  };

  // If the session references an entity that no longer exists, sign out
  const exists = await entityExists(role, entityId);
  if (!exists) {
    await signOut({ redirect: false });
    redirect("/login");
  }

  const { week } = await searchParams;

  return (
    <div className="flex flex-col flex-1">
      {role === "sm" && <SmView />}
      {role === "rm" && <RmDashboard week={week} />}
      {role === "ad" && <AdOverview />}
    </div>
  );
}
