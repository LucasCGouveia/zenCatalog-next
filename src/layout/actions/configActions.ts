'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getAuthenticatedUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");
  return session.user.id;
}

export async function getUserPrompts() {
  try {
    const userId = await getAuthenticatedUserId();
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

export async function updatePromptsAction(systemPrompt: string, chatPrompt: string) {
  try {
    const userId = await getAuthenticatedUserId();
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
