import { prisma } from '@/lib/prisma';
import { generateEmbedding } from './geminiService';

export const CatalogService = {
  async save(data: any, userId: string) {
    // Gerar o vetor (embedding) do resumo para o Chat inteligente
    const embedding = await generateEmbedding(data.summary);

    return await prisma.catalog.create({
      data: {
        ...data,
        embedding,
        userId
      }
    });
  },

  async listAll() {
    return await prisma.catalog.findMany({
      orderBy: { createdAt: 'desc' }
    });
  },

  async delete(id: string) {
    return await prisma.catalog.delete({ where: { id } });
  }
};