import { NextResponse } from 'next/server';
import { analyzeContent, analyzeFile, generateEmbedding } from '@/modulos/catalogo/services/geminiService';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, fileBase64, fileMimeType, isWatchEveryDay, priorityValue, fileName } = body;

    // 1. BUSCAR O USUÁRIO PRIMEIRO (Para pegar o prompt customizado)
    // Em produção, usaríamos a sessão do NextAuth. Aqui pegamos o admin como você fez.
    const user = await prisma.user.findFirst();
    if (!user) throw new Error("Usuário não encontrado.");

    // O prompt que o usuário editou na tela de configurações e salvou no banco
    const promptCustomizado = user.systemPrompt || undefined;

    // 2. ANÁLISE PELA IA (Passando o prompt do banco)
    let result;
    if (fileBase64) {
      // Adicionamos 'promptCustomizado' como último argumento
      result = await analyzeFile(fileBase64, fileMimeType, isWatchEveryDay, priorityValue, promptCustomizado);
    } else {
      // Adicionamos 'promptCustomizado' como último argumento
      result = await analyzeContent(description, isWatchEveryDay, priorityValue, promptCustomizado);
    }

    // 3. GERAÇÃO DE EMBEDDING (Igual ao anterior)
    const embedding = await generateEmbedding(result.summary);

    // 4. SALVAR NO MONGODB (Agora incluindo a duração)
    const savedItem = await prisma.catalog.create({
      data: {
        fileName: result.suggestedFilename,
        originalName: fileName || "Descrição Manual",
        summary: result.summary,
        category: result.category,
        subcategory: result.subcategory,
        subject: result.subject,
        author: result.author,
        duration: result.duration, // <--- NOVA LINHA: Salva o tempo que a IA extraiu
        isWatchEveryDay: isWatchEveryDay || false,
        priority: priorityValue || 1,
        embedding: embedding,
        userId: user.id
      }
    });

    return NextResponse.json(savedItem);
  } catch (error: any) {
    console.error("Erro na API de Análise:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}