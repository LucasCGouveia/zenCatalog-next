import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "../../catalogo/services/geminiService";

export const ChatService = {
  async suggestContent(query: string) {
    // 1. Transforma a pergunta (ex: "aula sobre atitude") em vetor
    const queryVector = await generateEmbedding(query);

    // 2. Busca no MongoDB usando busca vetorial (RAG)
    // Nota: Aqui no futuro usaremos o comando $vectorSearch do Atlas
    // Por enquanto, podemos buscar os títulos ou categorias que batem
    const suggestions = await prisma.catalog.findMany({
      where: {
        OR: [
          { summary: { contains: query, mode: 'insensitive' } },
          { subject: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 3
    });

    return suggestions;
  }
};