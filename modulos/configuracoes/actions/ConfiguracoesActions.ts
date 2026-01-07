'use server'

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function getSystemPrompt() {
  const session = await getServerSession(authOptions);
  
  // Se não estiver logado, retorna vazio
  if (!session?.user?.id) return "";

  try {
    // 1. Tenta buscar as configurações existentes deste usuário
    let settings = await prisma.settings.findUnique({
      where: { userId: session.user.id }
    });

    // 2. Se NÃO existirem (primeiro acesso), cria o registro.
    // O Prisma vai preencher o 'systemPrompt' automaticamente com o texto que você colocou no @default do Schema.
    if (!settings) {
      settings = await prisma.settings.create({
        data: { 
          userId: session.user.id
        }
      });
    }

    // 3. Retorna o texto (seja o padrão do schema ou o que o usuário editou depois)
    return settings.systemPrompt || "";
  } catch (error) {
    console.error("Erro ao buscar prompt:", error);
    return "";
  }
}

export async function saveSystemPrompt(newPrompt: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Login necessário" };

  try {
    // Atualiza ou Cria se não existir
    await prisma.settings.upsert({
      where: { userId: session.user.id },
      update: { systemPrompt: newPrompt },
      create: { 
        userId: session.user.id,
        systemPrompt: newPrompt 
      }
    });
    return { success: true };
  } catch (error) {
    return { error: "Erro ao salvar configurações" };
  }
}