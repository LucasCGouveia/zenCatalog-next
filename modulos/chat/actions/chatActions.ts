'use server'

import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/modulos/catalogo/services/geminiService";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function getChatHistory() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  try {
    const history = await prisma.chatMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
      take: 50
    });

    return history.map((msg: { role: string; content: unknown; }) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));
  } catch (error) {
    return [];
  }
}

export async function askChatZen(question: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Precisa de estar logado.");

    // 1. Busca contexto no banco (Se houver vídeos)
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
            { "$project": { "summary": 1, "fileName": 1, "author": 1, "observations": 1 } }
          ]
        }) as any[];
  
        contextText = contextResults.length > 0
          ? contextResults.map(doc => `Vídeo: ${doc.fileName}\nResumo: ${doc.summary}`).join("\n---\n")
          : "";
      } catch (err) {
        console.warn("Erro ao buscar contexto (índice pendente):", err);
      }
    } else {
      contextText = "Usuário ainda não tem vídeos cadastrados.";
    }

    const prompt = `
      Você é o ChatZen. Responda à pergunta usando o contexto abaixo.
      Contexto: ${contextText}
      Pergunta: "${question}"
    `;

    // 2. LÓGICA DE SELEÇÃO DE MODELO (Prioridade ao .ENV)
    
    // Lista base de modelos de fallback
    const defaultModels = [
      "gemini-1.5-flash-002", // Estável recente
      "gemini-1.5-flash",     // Genérico
      "gemini-pro"            // Legado
    ];

    // Se tiver algo no .ENV, coloca em PRIMEIRO lugar na lista
    const envModel = process.env.GEMINI_MODEL;
    
    let modelsToTry = envModel 
      ? [envModel, ...defaultModels] 
      : defaultModels;

    // Remove duplicatas (ex: se o .env for igual a um da lista)
    modelsToTry = [...new Set(modelsToTry)];

    let answer = "";
    let lastError = null;

    console.log("Tentando modelos na ordem:", modelsToTry);

    for (const modelName of modelsToTry) {
      if (!modelName) continue; // Pula vazios

      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        answer = result.response.text();
        console.log(`✅ Sucesso usando modelo: ${modelName}`);
        break; // Funcionou? Para o loop!
      } catch (e: any) {
        console.warn(`⚠️ Falha ao usar ${modelName}: ${e.message}`);
        lastError = e;
      }
    }

    if (!answer) {
      throw lastError || new Error("Nenhum modelo de IA disponível no momento.");
    }

    // 3. Salva no banco
    await prisma.chatMessage.createMany({
      data: [
        { role: 'user', content: question, userId: session.user.id },
        { role: 'assistant', content: answer, userId: session.user.id }
      ]
    });

    return { success: true, answer };

  } catch (error: any) {
    console.error("Erro final no ChatZen:", error);
    return { success: false, error: "Erro ao conectar com a IA: " + error.message };
  }
}