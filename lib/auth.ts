import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {

                console.log("=== TENTATIVA DE LOGIN ===");
                console.log("Email digitado:", credentials?.email);

                if (!credentials?.email || !credentials?.password) return null;

                // 1. Busca o usuário no MongoDB pelo Prisma
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user) {
                    console.log("ERRO: Usuário não encontrado no MongoDB");
                    return null;
                }
                // 2. Compara o hash do banco com a senha digitada
                // Essa parte é crucial e NÃO deve voltar para o "===" 
                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                console.log("Senha é válida?", isPasswordValid);
                if (!isPasswordValid) {
                    console.log("ERRO: Senha incorreta (Bcrypt retornou false)");
                    return null;
                }
                
                // 3. Retorna o objeto do usuário para a sessão
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                };
            }
        })
    ],
    pages: {
        // IMPORTANTE: Aqui você usa apenas '/login' (URL pública)
        // O Next.js resolve automaticamente para app/(auth)/login/page.tsx
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};