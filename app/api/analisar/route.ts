import { NextResponse } from 'next/server';
import { analyzeContent, generateEmbedding } from '@/src/catalogo/services/geminiService';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSystemPrompt } from "@/src/configuracoes/actions/ConfiguracoesActions";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { description, fileBase64, fileMimeType, fileName, duration, isWatchEveryDay, priorityValue } = body;

    if (!fileBase64) {
      throw new Error("O envio de um arquivo de vídeo é obrigatório.");
    }

    const baseSystemPrompt = await getSystemPrompt();

    const existingFiles = await prisma.catalog.findMany({
      where: { userId: session.user.id },
      select: { fileName: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // CORREÇÃO 1: Tipagem explícita no map (removendo o 'any')
    const existingFilesList = existingFiles.map((f: { fileName: string }) => f.fileName).join("\n");

    const combinedPrompt = `
      ${baseSystemPrompt}
      ### CONTEXTO DO ACERVO ATUAL:
      ${existingFilesList}
    `;

    const result = await analyzeContent({
      contentBase64: fileBase64,
      mimeType: fileMimeType,
      isWatchEveryDay: isWatchEveryDay,
      priorityValue: priorityValue,
      userDescription: description,
      customPrompt: combinedPrompt
    });

    const finalDuration = duration || result.duration;
    const textToVectorize = `Conteúdo: ${result.summary} | Observações: ${description}`;
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
        userId: session.user.id
      }
    });

    return NextResponse.json(savedItem);
    
  } catch (error: unknown) { // CORREÇÃO 2: unknown em vez de any
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    console.error("Erro na API:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}