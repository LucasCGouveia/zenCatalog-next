'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUserPrompt(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { systemPrompt: true }
    });
    return { success: true, prompt: user?.systemPrompt };
  } catch (error) {
    return { success: false, error: "Erro ao buscar prompt" };
  }
}

export async function updateSystemPrompt(userId: string, newPrompt: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { systemPrompt: newPrompt }
    });
    // Limpa o cache para que a próxima análise já use o prompt novo
    revalidatePath('/configuracoes');
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}