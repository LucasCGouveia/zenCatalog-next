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
  if (!session) throw new Error("Não autorizado");

  await CatalogService.delete(id);
  revalidatePath('/');
}

export async function updateCatalogAction(id: string, data: any) {
  try {
    const result = await CatalogService.update(id, data);
    revalidatePath('/biblioteca');
    revalidatePath('/'); // Atualiza a Home também se necessário
    return { success: true, data: result };
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    return { success: false, error: "Falha ao salvar alterações" };
  }
}