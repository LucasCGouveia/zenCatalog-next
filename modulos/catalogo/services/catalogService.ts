import { prisma } from '@/lib/prisma';
import { generateEmbedding } from './geminiService';

export const CatalogService = {
  async save(data: any, userId: string) {
    // CORREÇÃO: Removemos o 'suggestedFilename' que vem da IA mas não existe no Schema do banco
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { suggestedFilename, ...validData } = data;

    // Gerar o vetor (embedding) do resumo para o Chat inteligente
    const embedding = await generateEmbedding(validData.summary);

    return await prisma.catalog.create({
      data: {
        ...validData, // Agora enviamos apenas os campos válidos
        embedding,
        userId
      }
    });
  },

  async listAll(userId: string) {
    return await prisma.catalog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  },

  async delete(id: string, userId: string) {
    return await prisma.catalog.delete({
      where: { id, userId }
    });
  },

  async update(id: string, data: any, userId: string) {
    // Removemos também no update por segurança
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { suggestedFilename, ...validData } = data;

    return await prisma.catalog.update({
      where: { id, userId },
      data: {
        fileName: validData.fileName,
        summary: validData.summary,
        observations: validData.observations,
      }
    });
  },
};