import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Category, VideoAnalysis } from "../types";

const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const EMBEDDING_MODEL_NAME = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
const embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL_NAME });

// Schema de Resposta
const responseSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    category: {
      type: SchemaType.STRING,
      enum: Object.values(Category),
      description: "Categoria do vídeo"
    },
    subcategory: { type: SchemaType.STRING, description: "Subcategoria" },
    subject: { type: SchemaType.STRING, description: "Assunto principal" },
    author: { type: SchemaType.STRING, description: "Autor ou orador" },
    suggestedFilename: { type: SchemaType.STRING, description: "Nome sugerido seguindo o padrão" },
    summary: { type: SchemaType.STRING, description: "Resumo" },
    duration: { type: SchemaType.STRING, description: "Duração (MM:SS)" }
  },
  required: ["category", "subcategory", "subject", "author", "suggestedFilename", "summary", "duration"]
};

// Função auxiliar para instanciar o modelo
const getModel = (modelName: string) => {
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });
};

export async function generateEmbedding(text: string) {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Erro ao gerar embedding:", error);
    throw error;
  }
}

interface AnalyzeOptions {
  contentBase64?: string;
  mimeType?: string;
  transcriptText?: string;
  isWatchEveryDay: boolean;
  priorityValue?: number;
  userDescription?: string;
  customPrompt?: string;
}

export const analyzeContent = async ({
  contentBase64,
  mimeType,
  transcriptText,
  isWatchEveryDay,
  priorityValue,
  userDescription,
  customPrompt
}: AnalyzeOptions): Promise<VideoAnalysis> => {

  const promptFinal = `
  ${customPrompt || ''}
  
  CONTEXTO DO USUÁRIO: "${userDescription || ''}"
  
  INSTRUÇÃO CRÍTICA DE NOMENCLATURA:
  O campo 'suggestedFilename' DEVE OBRIGATORIAMENTE conter o nome do AUTOR no final.
  Padrão: [CATEGORIA] Subcategoria - Assunto - Autor.mp4
  
  Analise o conteúdo fornecido (Vídeo, Transcrição ou Metadados) e extraia os metadados.
  `;

  // Monta as partes do payload
  const parts: any[] = [{ text: promptFinal }];

  if (transcriptText) {
    parts.push({ text: `CONTEÚDO DE TEXTO (Legenda ou Metadados):\n${transcriptText}` });
  } else if (contentBase64 && mimeType) {
    parts.push({ inlineData: { data: contentBase64, mimeType } });
  }

  // --- LÓGICA DE RETRY COM BACKUP ---
  const primaryModelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash'; // Recomendado: 1.5-flash
  const backupModelName = process.env.GEMINI_MODEL_BACKUP;

  try {
    // 1. Tenta o Modelo Principal
    const model = getModel(primaryModelName);
    const result = await model.generateContent(parts);
    return processResponse(result, isWatchEveryDay, priorityValue);

  } catch (error: any) {
    console.warn(`⚠️ Falha no modelo principal (${primaryModelName}):`, error.message);

    // 2. Tenta o Backup
    if (backupModelName) {
      console.log(`🔄 Tentando reprocessar com BACKUP: ${backupModelName}...`);
      try {
        const backupModel = getModel(backupModelName);
        const result = await backupModel.generateContent(parts);
        return processResponse(result, isWatchEveryDay, priorityValue);
      } catch (backupError: any) {
        throw new Error(`Erro nos dois modelos. Principal: ${error.message} | Backup: ${backupError.message}`);
      }
    }
    throw error;
  }
};

// --- FUNÇÃO DE PROCESSAMENTO E CORREÇÃO (A MÁGICA ACONTECE AQUI) ---
function processResponse(result: any, isWatchEveryDay: boolean, priorityValue?: number): VideoAnalysis {
  const data = JSON.parse(result.response.text());

  // 1. CORREÇÃO DE AUTOR: Se a IA esqueceu o autor no nome, nós forçamos.
  if (data.author && data.suggestedFilename) {
    const cleanAuthor = data.author.trim();
    // Verifica se o nome do autor já está no nome do arquivo (ignorando maiúsculas/minúsculas)
    const hasAuthorInName = data.suggestedFilename.toLowerCase().includes(cleanAuthor.toLowerCase());

    if (!hasAuthorInName) {
      // Remove a extensão .mp4 se existir para não ficar ".mp4 - Autor"
      const nameWithoutExt = data.suggestedFilename.replace(/\.mp4$/i, '');
      data.suggestedFilename = `${nameWithoutExt} - ${cleanAuthor}.mp4`;
    }
  }

  // 2. CORREÇÃO DE EXTENSÃO: Garante que termina com .mp4
  if (!data.suggestedFilename.toLowerCase().endsWith('.mp4')) {
    data.suggestedFilename += '.mp4';
  }

  // 3. Lógica de Prioridade (Watch Every Day)
  if (isWatchEveryDay && priorityValue) {
    const prefix = priorityValue.toString().padStart(2, '0');
    // Verifica se já não colocou o prefixo para evitar duplicidade "[01] [01]..."
    if (!data.suggestedFilename.startsWith(`[${prefix}]`)) {
      data.suggestedFilename = `[${prefix}] ${data.suggestedFilename}`;
    }
  }

  return data as VideoAnalysis;
}