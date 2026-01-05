// modulos/chat/actions/chatActions.ts
'use server'

import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/modulos/catalogo/services/geminiService";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function askChatZen(question: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw new Error("Precisa de estar logado para usar o chat.");
    }
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
            // Filtro crucial: garante que a busca ocorre apenas no acervo do utilizador
            "filter": { "userId": { "$oid": session.user.id } }
          }
        },
        {
          "$project": {
            "summary": 1,
            "fileName": 1,
            "author": 1,
            "observations": 1,
            "score": { "$meta": "vectorSearchScore" }
          }
        }
      ]
    }) as unknown as any[];

    const contextText = contextResults.length > 0
      ? contextResults.map(doc =>
        `Vídeo: ${doc.fileName} | Autor: ${doc.author} | Resumo: ${doc.summary} | Notas: ${doc.observations}`
      ).join("\n\n")
      : "Nenhum conteúdo encontrado no acervo do utilizador.";

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Recomendado usar flash estável

    const prompt = `
      Você é o ChatZen, um assistente especializado na biblioteca espiritual e filosófica do usuário.
      Use o CONTEXTO abaixo para responder à PERGUNTA do usuário.
      
      CONTEXTO DO ACERVO PESSOAL:
      ${contextText}
      
      PERGUNTA: "${question}"
      
      Importante: Responda apenas com base no contexto. Se não encontrar, diga que o tema não está no acervo atual dele.
    `;

    const result = await model.generateContent(prompt);
    return { success: true, answer: result.response.text() };

  } catch (error: any) {
    console.error("Erro no ChatZen:", error);
    return { success: false, error: "Não consegui consultar o seu acervo agora." };
  }
}