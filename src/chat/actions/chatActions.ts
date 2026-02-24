'use server'

import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/src/catalogo/services/geminiService";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// --- FUNÇÃO AUXILIAR DE RETRY (BACKOFF EXPONENCIAL) ---
// Tenta chamar a IA até 3 vezes antes de desistir
async function generateWithRetry(model: any, prompt: string, attempt = 1): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    // Se for erro 429 (Too Many Requests) ou 503 (Servidor Ocupado)
    if ((error.message?.includes('429') || error.message?.includes('503')) && attempt <= 3) {
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
      console.warn(`Erro 429/503 detectado. Tentativa ${attempt} falhou. Retentando em ${delay}ms...`);

      // Espera o tempo calculado
      await new Promise(resolve => setTimeout(resolve, delay));

      // Tenta de novo (recursivamente)
      return generateWithRetry(model, prompt, attempt + 1);
    }
    throw error; // Se não for erro de limite, estoura o erro real
  }
}

// 1. LISTAR SESSÕES
export async function getChatSessions() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  try {
    const chats = await prisma.chatSession.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' }
      ],
      take: 20
    });
    return chats;
  } catch (error) {
    return [];
  }
}

// 2. LISTAR MENSAGENS
export async function getSessionMessages(sessionId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { userId: session.user.id, sessionId: sessionId },
      orderBy: { createdAt: 'asc' }
    });

    return messages.map((msg: { role: string; content: string; }) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));
  } catch (error) {
    return [];
  }
}

// 3. ENVIAR PERGUNTA (ASK)
export async function askChatZen(question: string, sessionId?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Precisa de estar logado.");

    // 1. Busca as configurações do Usuário (Prompt Personalizado)
    const userSettings = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { chatPrompt: true }
    });

    // 2. Define o Prompt do Sistema (Do banco ou Fallback)
    const systemInstruction = userSettings?.chatPrompt ||
      "Você é um assistente inteligente e útil. Responda baseando-se no contexto fornecido.";

    // 3. Gestão da Sessão
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const title = question.length > 30 ? question.substring(0, 30) + "..." : question;
      const newSession = await prisma.chatSession.create({
        data: { userId: session.user.id, title: title }
      });
      currentSessionId = newSession.id;
    } else {
      await prisma.chatSession.update({
        where: { id: currentSessionId },
        data: { updatedAt: new Date() }
      });
    }

    // 4. Busca de Contexto (RAG)
    const totalVideos = await prisma.catalog.count({ where: { userId: session.user.id } });
    let contextText = "";

    if (totalVideos > 0) {
      try {
        const queryVector = await generateEmbedding(question);
        const contextResults = await prisma.catalog.aggregateRaw({
          pipeline: [
            {
              "$vectorSearch": {
                "index": "vector_index",
                "path": "embedding",
                "queryVector": queryVector,
                "numCandidates": 100,
                "limit": 5,
                "filter": { "userId": { "$oid": session.user.id } }
              }
            },
            { "$project": { "summary": 1, "fileName": 1, "author": 1 } }
          ]
        }) as unknown as any[];

        contextText = contextResults.length > 0
          ? contextResults.map(doc => `--- VÍDEO ENCONTRADO ---\nTítulo: ${doc.fileName}\nConteúdo: ${doc.summary}`).join("\n\n")
          : "";
      } catch (e) { console.warn("Erro na busca vetorial:", e); }
    }

    // 5. Montagem Final do Prompt
    const finalPrompt = `
${systemInstruction}

CONTEXTO DO ACERVO PESSOAL (Use se for relevante):
${contextText}

PERGUNTA DO USUÁRIO:
"${question}"
        `;

    // 6. Chamada à IA com RETRY AUTOMÁTICO
    const envModel = process.env.GEMINI_MODEL;
    const modelsToTry = envModel
      ? [envModel, "gemini-1.5-flash", "gemini-pro"]
      : ["gemini-1.5-flash-002", "gemini-1.5-flash", "gemini-pro"];

    let answer = "";
    let lastError = null;

    // Loop entre modelos (Fallback de Modelos)
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        // Usa nossa função blindada 'generateWithRetry' em vez de chamar direto
        answer = await generateWithRetry(model, finalPrompt);
        break; // Se funcionou, sai do loop
      } catch (e) {
        lastError = e;
        console.error(`Falha no modelo ${modelName}:`, e);
        // Se falhar, tenta o próximo modelo da lista
      }
    }

    if (!answer) throw lastError || new Error("IA indisponível no momento.");

    await prisma.chatMessage.createMany({
      data: [
        { role: 'user', content: question, userId: session.user.id, sessionId: currentSessionId },
        { role: 'assistant', content: answer, userId: session.user.id, sessionId: currentSessionId }
      ]
    });

    return { success: true, answer, sessionId: currentSessionId };

  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao processar mensagem. Tente novamente em alguns segundos." };
  }
}

// 4. RENOMEAR SESSÃO
export async function renameSessionAction(sessionId: string, newTitle: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Login necessário" };

  try {
    await prisma.chatSession.update({
      where: { id: sessionId, userId: session.user.id },
      data: { title: newTitle }
    });
    return { success: true };
  } catch (error) {
    return { error: "Erro ao renomear" };
  }
}

// 5. FIXAR/DESAFINAR SESSÃO
export async function togglePinSessionAction(sessionId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Login necessário" };

  try {
    const current = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { isPinned: true }
    });

    if (!current) return { error: "Sessão não encontrada" };

    await prisma.chatSession.update({
      where: { id: sessionId, userId: session.user.id },
      data: { isPinned: !current.isPinned }
    });
    return { success: true };
  } catch (error) {
    return { error: "Erro ao fixar" };
  }
}