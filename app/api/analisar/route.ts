import { NextResponse } from 'next/server';
import { analyzeContent, analyzeFile, generateEmbedding } from '@/modulos/catalogo/services/geminiService';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, fileBase64, fileMimeType, isWatchEveryDay, priorityValue, fileName } = body;

    // 1. Análise pela IA
    let result;
    if (fileBase64) {
      result = await analyzeFile(fileBase64, fileMimeType, isWatchEveryDay, priorityValue);
    } else {
      result = await analyzeContent(description, isWatchEveryDay, priorityValue);
    }

    // 2. Geração de Embedding para o RAG (Chat Inteligente)
    // Usamos o resumo para criar o vetor de busca
    const embedding = await generateEmbedding(result.summary);

    // 3. Buscar o usuário padrão (admin)
    const user = await prisma.user.findFirst();
    if (!user) throw new Error("Usuário não encontrado. Certifique-se de rodar o seed.");

    // 4. Salvar no MongoDB
    const savedItem = await prisma.catalog.create({
      data: {
        fileName: result.suggestedFilename,
        originalName: fileName || "Descrição Manual",
        summary: result.summary,
        category: result.category,
        subcategory: result.subcategory,
        subject: result.subject,
        author: result.author,
        isWatchEveryDay: isWatchEveryDay || false,
        priority: priorityValue || 1,
        embedding: embedding, // Vetor para busca por "Atitude", "Paz", etc.
        userId: user.id
      }
    });

    return NextResponse.json(savedItem);
  } catch (error: any) {
    console.error("Erro na API de Análise:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}