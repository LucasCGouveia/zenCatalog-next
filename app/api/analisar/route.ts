// app/api/analisar/route.ts
import { NextResponse } from 'next/server';
import { analyzeContent, generateEmbedding } from '@/modulos/catalogo/services/geminiService'; // <--- MUDAMOS AQUI
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSystemPrompt } from "@/modulos/configuracoes/actions/ConfiguracoesActions";

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

    // --- 1. BUSCA O PROMPT ---
    const baseSystemPrompt = await getSystemPrompt();

    // --- 2. BUSCA O CONTEXTO (Arquivos Existentes) ---
    const existingFiles = await prisma.catalog.findMany({
      where: { userId: session.user.id },
      select: { fileName: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const existingFilesList = existingFiles.map((f: { fileName: any; }) => f.fileName).join("\n");

    // --- 3. MONTA O PROMPT FINAL ---
    const combinedPrompt = `
      ${baseSystemPrompt}

      ### CONTEXTO DO ACERVO ATUAL (Para verificação de sequência):
      LISTA DE ARQUIVOS EXISTENTES:
      ${existingFilesList}
    `;

    // --- 4. CHAMA O SERVIÇO DO GEMINI (ATUALIZADO) ---
    // Agora passamos um objeto de opções, não mais argumentos soltos
    const result = await analyzeContent({
      contentBase64: fileBase64,
      mimeType: fileMimeType,
      isWatchEveryDay: isWatchEveryDay,
      priorityValue: priorityValue,
      userDescription: description,
      customPrompt: combinedPrompt
    });

    const finalDuration = duration || result.duration;

    // Gera o vetor para busca semântica (RAG)
    const textToVectorize = `Conteúdo: ${result.summary} | Observações do Usuário: ${description}`;
    const embedding = await generateEmbedding(textToVectorize);

    // Salva no Banco
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
    
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    console.error("Erro na API:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}