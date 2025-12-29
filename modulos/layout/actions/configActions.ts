'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUserPrompts(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        systemPrompt: true, 
        chatPrompt: true 
      }
    });
    return { 
      success: true, 
      prompts: {
        system: user?.systemPrompt || "",
        chat: user?.chatPrompt || ""
      } 
    };
  } catch (error) {
    return { success: false, error: "Erro ao buscar prompts" };
  }
}

export async function updatePromptsAction(userId: string, systemPrompt: string, chatPrompt: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        systemPrompt, 
        chatPrompt 
      }
    });
    revalidatePath('/configuracoes');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao atualizar prompts" };
  }
}