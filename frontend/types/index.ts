import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      token?: string;
    }
  }

  interface User {
    token?: string;
    id?: string;
    name?: string | null;
    email?: string | null;}
}
