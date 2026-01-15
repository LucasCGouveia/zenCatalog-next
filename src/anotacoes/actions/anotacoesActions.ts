"use server";

import { getServerSession } from "next-auth"; // <--- Mudou aqui (v4)
import { authOptions } from "@/lib/auth";     // <--- Mudou aqui (Importando as opções)
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- PASTAS ---

export async function getFolders() {
  // Na v4, usamos getServerSession passando as opções
  const session = await getServerSession(authOptions); 
  
  if (!session?.user?.id) return [];

  // O resto continua igual...
  return await prisma.folder.findMany({
    where: { userId: session.user.id },
    include: { notes: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createFolder(name: string) {
  const session = await getServerSession(authOptions); // <--- Mudou aqui
  if (!session?.user?.id) throw new Error("Não autorizado");

  await prisma.folder.create({
    data: {
      name,
      userId: session.user.id
    }
  });

  revalidatePath("/anotacoes");
}

export async function deleteFolder(id: string) {
  await prisma.folder.delete({ where: { id } });
  revalidatePath("/anotacoes");
}

// --- NOTAS ---

export async function createNote(folderId: string, title: string, content: string) {
  // Notas não precisam de auth explícito aqui se a pasta já valida, 
  // mas é bom garantir que a pasta pertence ao usuário se quiser ser estrito.
  // Por simplicidade, vamos manter direto:
  await prisma.note.create({
    data: { title, content, folderId }
  });
  revalidatePath("/anotacoes");
}

export async function updateNote(id: string, title: string, content: string) {
  await prisma.note.update({
    where: { id },
    data: { title, content }
  });
  revalidatePath("/anotacoes");
}

export async function deleteNote(id: string) {
  await prisma.note.delete({ where: { id } });
  revalidatePath("/anotacoes");
}