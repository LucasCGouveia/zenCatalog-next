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

  async listAll(userId: string) { // Adicionado parâmetro userId
    return await prisma.catalog.findMany({
      where: { userId }, // Filtro essencial adicionado
      orderBy: { createdAt: 'desc' }
    });
  },

  async delete(id: string, userId: string) {
    return await prisma.catalog.delete({
      where: { id, userId }
    });
  },

  async update(id: string, data: any) {
    return await prisma.catalog.update({
      where: { id },
      data: {
        summary: data.summary,
        observations: data.observations,
        // Você pode adicionar outros campos aqui se quiser editar mais coisas
      }
    });
  },
};