import "next-auth";

declare module "next-auth" {
  interface User {
    role: "sm" | "rm" | "ad";
    entityId: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: "sm" | "rm" | "ad";
      entityId: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "sm" | "rm" | "ad";
    entityId: string;
  }
}
