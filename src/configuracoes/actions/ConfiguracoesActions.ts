'use server'

import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const DEFAULT_PROMPT = `
Você é o Curador Digital ZenCatalog. Organize o acervo com precisão.
Categorias: [ESP], [HIST], [FILO], [DICA], [POEMA], [FAMILY], [É Ela], [OUTROS].
`;

export async function getSystemPrompt() {
  const session = await getServerSession(authOptions);
  
  // Se não houver sessão, retorna o padrão
  if (!session?.user?.id) {
    return DEFAULT_PROMPT;
  }

  try {
    // CORREÇÃO: Busca diretamente no model User
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { systemPrompt: true } // Trazemos apenas o campo que interessa
    });

    // Se o campo estiver vazio ou nulo, usa o padrão
    return user?.systemPrompt || DEFAULT_PROMPT;

  } catch (error) {
    console.error("Erro ao buscar configurações do usuário:", error);
    return DEFAULT_PROMPT; 
  }
}

export async function saveSystemPrompt(newPrompt: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");

  // CORREÇÃO: Atualiza o campo no model User existente
  return await prisma.user.update({
    where: { id: session.user.id },
    data: { systemPrompt: newPrompt }
  });
}