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