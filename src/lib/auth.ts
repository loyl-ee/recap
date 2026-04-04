import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [found] = await db
          .select()
          .from(user)
          .where(eq(user.email, credentials.email as string))
          .limit(1);

        if (!found) return null;

        const valid = await compare(
          credentials.password as string,
          found.passwordHash
        );
        if (!valid) return null;

        return {
          id: found.id,
          email: found.email,
          role: found.role,
          entityId: found.entityId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { role: string; entityId: string };
        token.role = u.role;
        token.entityId = u.entityId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        const s = session.user as unknown as Record<string, unknown>;
        s.role = token.role;
        s.entityId = token.entityId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
