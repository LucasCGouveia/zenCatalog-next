import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "../../catalogo/services/geminiService";

export const ChatService = {
  async suggestContent(query: string, userId: string) {

    const queryVector = await generateEmbedding(query);

    const suggestions = await prisma.catalog.findMany({
      where: {
        userId,
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