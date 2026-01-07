// app/api/analisar/route.ts
import { NextResponse } from 'next/server';
import { analyzeFile, generateEmbedding } from '@/modulos/catalogo/services/geminiService';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// IMPORTANTE: Trazendo o prompt da nova tabela Settings
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

    // --- 1. BUSCA O "CÉREBRO" (Prompt Configurado) ---
    // Essa função busca na tabela Settings ou retorna o padrão do Schema
    const baseSystemPrompt = await getSystemPrompt();

    // --- 2. BUSCA O CONTEXTO (Arquivos Existentes) ---
    // Buscamos os nomes dos últimos 50 arquivos para a IA entender a sequência (ex: se já tem aula 01, sugere a 02)
    const existingFiles = await prisma.catalog.findMany({
      where: { userId: session.user.id },
      select: { fileName: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const existingFilesList = existingFiles.map((f: { fileName: unknown; }) => f.fileName).join("\n");

    // --- 3. MONTA O PROMPT FINAL COMBINADO ---
    const combinedPrompt = `
      ${baseSystemPrompt}

      ### CONTEXTO DO ACERVO ATUAL (Para verificação de sequência):
      Abaixo estão os arquivos que JÁ existem na biblioteca do usuário. 
      Use esta lista para decidir numerações sequenciais (ex: se já existe "Aula 01", nomeie o novo como "Aula 02").
      
      LISTA DE ARQUIVOS EXISTENTES:
      ${existingFilesList}
    `;

    // --- 4. CHAMA O SERVIÇO DO GEMINI ---
    const result = await analyzeFile(
      fileBase64,
      fileMimeType,
      isWatchEveryDay,
      priorityValue,
      description,
      combinedPrompt // Passamos o prompt turbinado aqui
    );

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
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    console.error("Erro na API:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}