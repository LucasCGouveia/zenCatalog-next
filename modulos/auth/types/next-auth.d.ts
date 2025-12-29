// modulos/auth/types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Estendemos a sessão para incluir o ID do MongoDB e o Token do Google
   */
  interface Session {
    accessToken?: string;
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string; // Garante que o ID do banco seja reconhecido como string
  }
}

declare module "next-auth/jwt" {
  /**
   * Estendemos o JWT para persistir os dados entre as chamadas
   */
  interface JWT {
    id: string;
    accessToken?: string;
    refreshToken?: string;
  }
}