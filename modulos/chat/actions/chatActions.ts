// modulos/chat/actions/chatActions.ts
'use server'

import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/modulos/catalogo/services/geminiService";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function askChatZen(question: string) {
  try {
    // 1. Gerar o embedding da pergunta do usuário
    const queryVector = await generateEmbedding(question);

    // 2. Busca Vetorial no MongoDB Atlas
    // Nota: O Prisma ainda não suporta $vectorSearch nativamente via API fluente, 
    // então usamos uma aggregation direta.
    const contextResults = await prisma.catalog.aggregateRaw({
        pipeline: [
            {
                "$vectorSearch": {
                    "index": "vector_index", // Você precisará criar este índice no Atlas (explico abaixo)
                    "path": "embedding",
                    "queryVector": queryVector,
                    "numCandidates": 100,
                    "limit": 3 // Trazemos os 3 vídeos mais relevantes
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

    // 3. Montar o Contexto para o Gemini
    const contextText = contextResults.map(doc => 
      `Vídeo: ${doc.fileName} | Autor: ${doc.author} | Resumo: ${doc.summary} | Notas do Usuário: ${doc.observations}`
    ).join("\n\n");

    // 4. Enviar para o Gemini responder baseado no contexto
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    const prompt = `
      Você é o ChatZen, um assistente especializado na biblioteca espiritual e filosófica do usuário.
      Use o CONTEXTO abaixo para responder à PERGUNTA do usuário de forma acolhedora e precisa.
      
      CONTEXTO DO ACERVO:
      ${contextText}
      
      PERGUNTA: "${question}"
      
      Caso a resposta não esteja no contexto, diga educadamente que não encontrou esse tema específico no acervo atual.
    `;

    const result = await model.generateContent(prompt);
    return { success: true, answer: result.response.text() };

  } catch (error: any) {
    console.error("Erro no ChatZen:", error);
    return { success: false, error: "Não consegui consultar o acervo agora." };
  }
}