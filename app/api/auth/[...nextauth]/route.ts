// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Importa a lógica centralizada

const handler = NextAuth(authOptions);

// Exporta apenas os métodos permitidos pelo App Router
export { handler as GET, handler as POST };