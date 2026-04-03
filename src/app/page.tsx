import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SmView } from "@/components/sm-view";
import { RmDashboard } from "@/components/rm-dashboard";
import { AdOverview } from "@/components/ad-overview";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role } = session.user as { role: "sm" | "rm" | "ad" };

  return (
    <div className="flex flex-col flex-1">
      {role === "sm" && <SmView />}
      {role === "rm" && <RmDashboard />}
      {role === "ad" && <AdOverview />}
    </div>
  );
}
