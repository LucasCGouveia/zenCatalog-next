import { NextResponse } from 'next/server';
import { analyzeFile, generateEmbedding } from '@/modulos/catalogo/services/geminiService';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, fileBase64, fileMimeType, fileName, duration, isWatchEveryDay, priorityValue } = body;

    // 1. Busca o usuário e seu prompt personalizado
    const user = await prisma.user.findFirst();
    if (!user) throw new Error("Usuário não encontrado.");

    // Pegamos o prompt que você editou lá na tela de configurações
    const customPrompt = user.systemPrompt || undefined;

    // 2. Análise obrigatória via Arquivo (já que removemos o analyzeContent)
    if (!fileBase64) {
      throw new Error("O envio de um arquivo de vídeo é obrigatório.");
    }

    const result = await analyzeFile(
      fileBase64,
      fileMimeType,
      isWatchEveryDay,
      priorityValue,
      description, // Aqui entra a observação do usuário
      customPrompt // Aqui entra as regras de nome de arquivo [ESP], [FILO], etc.
    );

    const finalDuration = duration || result.duration;

    // 3. VETORIZAÇÃO INTELIGENTE: Mesclamos o resumo da IA com o que o usuário escreveu
    // Isso garante que o ChatZen ache o vídeo mesmo que você pesquise por algo que só escreveu na observação
    const textToVectorize = `Conteúdo: ${result.summary} | Observações do Usuário: ${description}`;
    const embedding = await generateEmbedding(textToVectorize);

    // 4. Salvar no MongoDB
    const savedItem = await prisma.catalog.create({
      data: {
        fileName: result.suggestedFilename,
        originalName: fileName || "upload_video",
        summary: result.summary,
        observations: description, // Salvamos sua nota íntima aqui
        category: result.category,
        subcategory: result.subcategory,
        subject: result.subject,
        author: result.author,
        duration: finalDuration,
        isWatchEveryDay: isWatchEveryDay || false,
        priority: priorityValue || 1,
        embedding: embedding, // Vetor rico (IA + Humano)
        userId: user.id
      }
    });

    return NextResponse.json(savedItem);
  } catch (error: any) {
    console.error("Erro na API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}