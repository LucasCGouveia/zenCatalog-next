import {
  GoogleGenerativeAI,
  SchemaType,
  type GenerateContentResult,
  type Part,
  type ResponseSchema,
} from "@google/generative-ai";
import { FileState, GoogleAIFileManager } from "@google/generative-ai/server";
import { Category, VideoAnalysis } from "../types";

const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const fileManager = new GoogleAIFileManager(API_KEY);
const EMBEDDING_MODEL_NAME = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
const embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL_NAME });

function normalizeEmbedding(embedding: number[]) {
  return embedding.length > 768 ? embedding.slice(0, 768) : embedding;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

// Schema de Resposta
const responseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    category: {
      type: SchemaType.STRING,
      format: "enum",
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
    let embedding = result.embedding.values;

    // GARANTIA DE DIMENSÃO: Se o modelo retornar mais de 768 dimensões (ex: 3072),
    // cortamos o vetor para 768 para bater exatamente com o índice do MongoDB.
    if (embedding.length > 768) {
      embedding = embedding.slice(0, 768);
    }

    return normalizeEmbedding(embedding);
  } catch (error) {
    console.error("Erro ao gerar embedding:", error);
    throw error;
  }
}

interface AnalyzeOptions {
  contentBase64?: string;
  mimeType?: string;
  fileUri?: string;
  transcriptText?: string;
  isWatchEveryDay: boolean;
  priorityValue?: number;
  userDescription?: string;
  customPrompt?: string;
}

export const analyzeContent = async ({
  contentBase64,
  mimeType,
  fileUri,
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
  const parts: Part[] = [{ text: promptFinal }];

  if (transcriptText) {
    parts.push({ text: `CONTEÚDO DE TEXTO (Legenda ou Metadados):\n${transcriptText}` });
  } else if (fileUri && mimeType) {
    parts.push({ fileData: { fileUri, mimeType } });
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

  } catch (error: unknown) {
    const primaryErrorMessage = getErrorMessage(error);
    console.warn(`⚠️ Falha no modelo principal (${primaryModelName}):`, primaryErrorMessage);

    // 2. Tenta o Backup
    if (backupModelName) {
      console.log(`🔄 Tentando reprocessar com BACKUP: ${backupModelName}...`);
      try {
        const backupModel = getModel(backupModelName);
        const result = await backupModel.generateContent(parts);
        return processResponse(result, isWatchEveryDay, priorityValue);
      } catch (backupError: unknown) {
        throw new Error(
          `Erro nos dois modelos. Principal: ${primaryErrorMessage} | Backup: ${getErrorMessage(backupError)}`
        );
      }
    }
    throw error;
  }
};

export async function uploadGeminiFileFromBuffer(buffer: Buffer, mimeType: string, displayName: string) {
  const upload = await fileManager.uploadFile(buffer, {
    mimeType,
    displayName,
  });

  let file = upload.file;

  for (let attempt = 0; attempt < 30 && file.state === FileState.PROCESSING; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    file = await fileManager.getFile(file.name);
  }

  if (file.state === FileState.FAILED) {
    throw new Error("Falha ao preparar o arquivo de vídeo no Gemini.");
  }

  if (file.state !== FileState.ACTIVE) {
    throw new Error("O Gemini não concluiu a preparação do vídeo dentro do tempo esperado.");
  }

  return file;
}

// --- FUNÇÃO DE PROCESSAMENTO E CORREÇÃO (A MÁGICA ACONTECE AQUI) ---
function processResponse(
  result: GenerateContentResult,
  isWatchEveryDay: boolean,
  priorityValue?: number
): VideoAnalysis {
  const data = JSON.parse(result.response.text()) as VideoAnalysis;

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

export async function generateEmbeddings(texts: string[]) {
  const embeddings: number[][] = [];
  const batchSize = 5;

  for (let index = 0; index < texts.length; index += batchSize) {
    const batch = texts.slice(index, index + batchSize);
    let result;

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      try {
        result = await embeddingModel.batchEmbedContents({
          requests: batch.map((text) => ({
            content: { role: "user", parts: [{ text }] },
          })),
        });
        break;
      } catch (error) {
        const message = getErrorMessage(error);
        const retryable = message.includes("429") || message.includes("503");
        if (!retryable || attempt === 5) throw error;

        const delay = attempt * 10_000;
        console.warn(
          `Limite temporário ao vetorizar documentos. Nova tentativa em ${delay / 1000}s.`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (!result) throw new Error("Não foi possível gerar embeddings.");
    embeddings.push(
      ...result.embeddings.map((embedding) =>
        normalizeEmbedding(embedding.values),
      ),
    );
  }

  return embeddings;
}
