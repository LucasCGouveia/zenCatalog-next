// app/api/analisar/route.ts
import { NextResponse } from 'next/server';
import { analyzeFile, generateEmbedding } from '@/modulos/catalogo/services/geminiService';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Ajustado para importar da lib

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { description, fileBase64, fileMimeType, fileName, duration, isWatchEveryDay, priorityValue } = body;

    // 1. Busca o usuário e seu prompt personalizado
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    if (!user) throw new Error("Usuário não encontrado.");

    const customPrompt = user.systemPrompt || undefined;

    if (!fileBase64) {
      throw new Error("O envio de um arquivo de vídeo é obrigatório.");
    }

    const result = await analyzeFile(
      fileBase64,
      fileMimeType,
      isWatchEveryDay,
      priorityValue,
      description,
      customPrompt
    );

    const finalDuration = duration || result.duration;

    const textToVectorize = `Conteúdo: ${result.summary} | Observações do Usuário: ${description}`;
    const embedding = await generateEmbedding(textToVectorize);

    const savedItem = await prisma.catalog.create({
      data: {
        fileName: result.suggestedFilename,
        originalName: fileName || "upload_video",
        summary: result.summary,
        observations: description,
        category: result.category,
        subcategory: result.subcategory,
        subject: result.subject,
        author: result.author,
        duration: finalDuration,
        isWatchEveryDay: isWatchEveryDay || false,
        priority: priorityValue || 1,
        embedding: embedding,
        userId: user.id
      }
    });

    return NextResponse.json(savedItem);
    
  } catch (error: unknown) { // Mudado para unknown como você desejava
    // Lógica para extrair a mensagem de erro de forma segura
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    
    console.error("Erro na API:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}