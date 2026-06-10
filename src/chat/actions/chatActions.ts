"use server";

import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  findSimilarCatalogs,
  findSimilarDocumentChunks,
} from "@/lib/vector";
import { generateEmbedding } from "@/src/catalogo/services/geminiService";
import {
  buildChatPrompt,
  formatConversationHistory,
} from "@/src/chat/services/chatPrompt";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const defaultChatPrompt =
  "Você é um assistente inteligente e útil. Responda com clareza, considerando o contexto fornecido.";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function generateWithRetry(
  model: GenerativeModel,
  prompt: string,
  attempt = 1,
): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    const message = errorMessage(error);
    const retryable = message.includes("429") || message.includes("503");

    if (retryable && attempt <= 3) {
      const delay = 2 ** attempt * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return generateWithRetry(model, prompt, attempt + 1);
    }

    throw error;
  }
}

async function getAuthenticatedUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Login necessário.");
  return session.user.id;
}

export async function getChatSessions() {
  try {
    const userId = await getAuthenticatedUserId();
    return await prisma.chatSession.findMany({
      where: { userId },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      take: 20,
    });
  } catch {
    return [];
  }
}

export async function getSessionMessages(sessionId: string) {
  try {
    const userId = await getAuthenticatedUserId();
    const ownedSession = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true },
    });
    if (!ownedSession) return [];

    const messages = await prisma.chatMessage.findMany({
      where: { userId, sessionId: ownedSession.id },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });

    return messages.map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    }));
  } catch {
    return [];
  }
}

export async function askChatZen(question: string, sessionId?: string) {
  try {
    const userId = await getAuthenticatedUserId();
    const cleanQuestion = question.trim();
    if (!cleanQuestion) throw new Error("Escreva uma pergunta.");

    const userSettings = await prisma.user.findUnique({
      where: { id: userId },
      select: { chatPrompt: true },
    });
    const systemInstruction =
      userSettings?.chatPrompt?.trim() || defaultChatPrompt;

    let currentSessionId = sessionId;
    if (currentSessionId) {
      const ownedSession = await prisma.chatSession.findFirst({
        where: { id: currentSessionId, userId },
        select: { id: true },
      });
      if (!ownedSession) throw new Error("Conversa não encontrada.");

      await prisma.chatSession.update({
        where: { id: ownedSession.id },
        data: { updatedAt: new Date() },
      });
    } else {
      const title =
        cleanQuestion.length > 30
          ? `${cleanQuestion.slice(0, 30)}...`
          : cleanQuestion;
      const newSession = await prisma.chatSession.create({
        data: { userId, title },
      });
      currentSessionId = newSession.id;
    }

    const recentMessages = await prisma.chatMessage.findMany({
      where: { userId, sessionId: currentSessionId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { role: true, content: true },
    });
    const conversationHistory = formatConversationHistory(
      recentMessages.reverse(),
    );

    let contextText = "";
    const [totalVideos, totalDocuments] = await Promise.all([
      prisma.catalog.count({ where: { userId } }),
      prisma.libraryDocument.count({ where: { userId, status: "READY" } }),
    ]);
    if (totalVideos > 0 || totalDocuments > 0) {
      try {
        const queryVector = await generateEmbedding(cleanQuestion);
        const [videoMatches, documentMatches] = await Promise.all([
          findSimilarCatalogs(userId, queryVector, 5),
          findSimilarDocumentChunks(userId, queryVector, 8),
        ]);
        const videoContext = videoMatches
          .map(
            (item) =>
              `--- VÍDEO ENCONTRADO ---\nArquivo: ${item.fileName}\nConteúdo: ${item.summary}`,
          )
          .join("\n\n");
        const documentContext = documentMatches
          .map(
            (item) =>
              `--- DOCUMENTO ENCONTRADO ---\nDocumento: ${item.documentName}\nTipo: ${item.fileType}\nTrecho: ${item.content}`,
          )
          .join("\n\n");
        contextText = [videoContext, documentContext].filter(Boolean).join("\n\n");
      } catch (error) {
        console.warn("Erro na busca vetorial:", error);
      }
    }

    const prompt = buildChatPrompt({
      systemInstruction,
      conversationHistory,
      contextText,
      question: cleanQuestion,
    });

    const modelsToTry = Array.from(
      new Set(
        [
          process.env.GEMINI_MODEL,
          process.env.GEMINI_MODEL_BACKUP,
          "gemini-1.5-flash",
        ].filter((model): model is string => Boolean(model)),
      ),
    );

    let answer = "";
    let lastError: unknown;
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        answer = await generateWithRetry(model, prompt);
        break;
      } catch (error) {
        lastError = error;
        console.error(`Falha no modelo ${modelName}:`, error);
      }
    }

    if (!answer) {
      throw lastError || new Error("IA indisponível no momento.");
    }

    await prisma.chatMessage.createMany({
      data: [
        {
          role: "user",
          content: cleanQuestion,
          userId,
          sessionId: currentSessionId,
        },
        {
          role: "assistant",
          content: answer,
          userId,
          sessionId: currentSessionId,
        },
      ],
    });

    return { success: true, answer, sessionId: currentSessionId };
  } catch (error) {
    console.error("Erro no ChatZen:", error);
    return {
      success: false,
      error: "Erro ao processar mensagem. Tente novamente em alguns segundos.",
    };
  }
}

export async function renameSessionAction(
  sessionId: string,
  newTitle: string,
) {
  try {
    const userId = await getAuthenticatedUserId();
    const result = await prisma.chatSession.updateMany({
      where: { id: sessionId, userId },
      data: { title: newTitle.trim() },
    });
    return result.count ? { success: true } : { error: "Conversa não encontrada" };
  } catch {
    return { error: "Erro ao renomear" };
  }
}

export async function togglePinSessionAction(sessionId: string) {
  try {
    const userId = await getAuthenticatedUserId();
    const current = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true, isPinned: true },
    });
    if (!current) return { error: "Conversa não encontrada" };

    await prisma.chatSession.update({
      where: { id: current.id },
      data: { isPinned: !current.isPinned },
    });
    return { success: true };
  } catch {
    return { error: "Erro ao fixar" };
  }
}
