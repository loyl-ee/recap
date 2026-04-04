import { auth } from "@/lib/auth";

export type UserRole = "sm" | "rm" | "ad";

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  entityId: string;
};

/**
 * Get the current session user with proper typing.
 * Returns null if not authenticated.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;

  const user = session.user as Record<string, unknown>;
  if (!user.role || !user.entityId) return null;

  return {
    id: user.id as string ?? user.sub as string ?? "",
    email: user.email as string ?? "",
    role: user.role as UserRole,
    entityId: user.entityId as string,
  };
}

/**
 * Get the current session user, throwing if not authenticated or wrong role.
 */
export async function requireRole(role: UserRole): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  if (user.role !== role) throw new Error(`Requires ${role} role`);
  return user;
}
