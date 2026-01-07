'use server'

import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/modulos/catalogo/services/geminiService";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 1. LISTAR (Atualizado com ordenação por PIN)
export async function getChatSessions() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  try {
    const chats = await prisma.chatSession.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isPinned: 'desc' }, // Fixados aparecem primeiro
        { updatedAt: 'desc' } // Depois, os mais recentes
      ],
      take: 20
    });
    return chats;
  } catch (error) {
    return [];
  }
}

// ... (getSessionMessages e askChatZen continuam IGUAIS, não precisa mexer) ...
export async function getSessionMessages(sessionId: string) {
    // ... (mantenha o código anterior aqui)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];
  
    try {
      const messages = await prisma.chatMessage.findMany({
        where: { 
          userId: session.user.id,
          sessionId: sessionId 
        },
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

export async function askChatZen(question: string, sessionId?: string) {
    // ... (Copie a função askChatZen do passo anterior inteira aqui)
    // Se quiser, posso reenviar ela completa, mas é a mesma lógica de antes.
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Precisa de estar logado.");
    
        // --- Lógica de Criação de Sessão ---
        let currentSessionId = sessionId;
    
        // Se não tem sessão (Novo Chat), cria uma agora
        if (!currentSessionId) {
          const title = question.length > 30 ? question.substring(0, 30) + "..." : question;
          const newSession = await prisma.chatSession.create({
            data: {
              userId: session.user.id,
              title: title
            }
          });
          currentSessionId = newSession.id;
        } else {
          // Se já existe, atualiza o 'updatedAt' da sessão para ela subir na lista
          await prisma.chatSession.update({
            where: { id: currentSessionId },
            data: { updatedAt: new Date() }
          });
        }
    
        // --- Busca de Contexto (RAG) ---
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
                    "limit": 3,
                    "filter": { "userId": { "$oid": session.user.id } }
                  }
                },
                { "$project": { "summary": 1, "fileName": 1, "author": 1 } }
              ]
            }) as unknown as any[];
            
            contextText = contextResults.length > 0
              ? contextResults.map(doc => `Vídeo: ${doc.fileName}\nResumo: ${doc.summary}`).join("\n---\n")
              : "";
          } catch (e) { console.warn("Index pendente"); }
        }
    
        const prompt = `
          Você é o ChatZen, um assistente pedagógico e espiritual.
          O usuário quer ajuda para montar AULAS e DINÂMICAS.
          Contexto do Acervo Pessoal (se útil): ${contextText}
          Pergunta do Usuário: "${question}"
        `;
    
        const envModel = process.env.GEMINI_MODEL;
        const modelsToTry = envModel 
          ? [envModel, "gemini-1.5-flash", "gemini-pro"] 
          : ["gemini-1.5-flash-002", "gemini-1.5-flash", "gemini-pro"];
    
        let answer = "";
        for (const modelName of modelsToTry) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            answer = result.response.text();
            break;
          } catch (e) {}
        }
    
        if (!answer) throw new Error("IA indisponível.");
    
        await prisma.chatMessage.createMany({
          data: [
            { role: 'user', content: question, userId: session.user.id, sessionId: currentSessionId },
            { role: 'assistant', content: answer, userId: session.user.id, sessionId: currentSessionId }
          ]
        });
    
        return { success: true, answer, sessionId: currentSessionId }; 
    
      } catch (error) {
        return { success: false, error: "erro" };
      }
}

// --- NOVAS FUNÇÕES ---

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
    // Busca o estado atual para inverter
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