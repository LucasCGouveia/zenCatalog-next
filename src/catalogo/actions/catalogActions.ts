'use server'

import { CatalogService } from '../services/catalogService';
import { revalidatePath } from 'next/cache';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function saveCatalogAction(data: any) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Você precisa estar logado para salvar.");
  }

  const result = await CatalogService.save(data, session.user.id);
  revalidatePath('/');
  return result;
}

export async function deleteCatalogAction(id: string) {
  const session = await getServerSession(authOptions);

  // Verificamos se o usuário está logado e se temos o ID dele
  if (!session?.user?.id) throw new Error("Não autorizado");

  // Agora passamos o ID do usuário como SEGUNDO argumento
  await CatalogService.delete(id, session.user.id);

  revalidatePath('/');
  revalidatePath('/biblioteca');
}

export async function updateCatalogAction(id: string, data: any) {
try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Não autorizado");

    // Passamos o ID do usuário aqui também para segurança
    const result = await CatalogService.update(id, data, session.user.id);
    
    revalidatePath('/biblioteca');
    revalidatePath('/');
    return { success: true, data: result };
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    return { success: false, error: "Falha ao salvar alterações" };
  }
}