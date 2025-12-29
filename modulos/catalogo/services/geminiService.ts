import { GoogleGenerativeAI, SchemaType, ResponseSchema } from "@google/generative-ai";
import { Category, VideoAnalysis } from "../types";

// Pegando a chave do ambiente (Server Side)
const API_KEY = process.env.GEMINI_API_KEY || '';
console.log("DEBUG: A chave carregada é:", API_KEY ? "SUCESSO (começa com " + API_KEY.substring(0, 5) + ")" : "VAZIA");
const genAI = new GoogleGenerativeAI(API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// Tipando explicitamente como ResponseSchema para evitar o erro ts(2322)
const responseSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    category: { 
      type: SchemaType.STRING, 
      enum: Object.values(Category),
      description: "Categoria do vídeo"
    },
    subcategory: { 
      type: SchemaType.STRING,
      description: "Subcategoria ou sentimento" 
    },
    subject: { 
      type: SchemaType.STRING,
      description: "Assunto principal"
    },
    author: { 
      type: SchemaType.STRING,
      description: "Autor ou orador"
    },
    suggestedFilename: { 
      type: SchemaType.STRING,
      description: "Nome de arquivo sugerido"
    },
    summary: { 
      type: SchemaType.STRING,
      description: "Resumo do conteúdo"
    },
    duration:{
      type: SchemaType.STRING,
      description: "Duração aproximada (ex: 05:20)"
    }
  },
  required: ["category", "subcategory", "subject", "author", "suggestedFilename", "summary", "duration"]
};

const model = genAI.getGenerativeModel({
  //model: "gemini-1.5-flash", 
  model: "gemini-3-flash-preview",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: responseSchema,
  },
});

export const analyzeContent = async (
  description: string, 
  isWatchEveryDay: boolean,
  priorityValue?: number,
  customPrompt?: string // <-- Aceita o prompt do banco
): Promise<VideoAnalysis> => {
  const basePrompt = customPrompt || `Atue como um especialista em catalogação...`;
  
  const prompt = `
    ${basePrompt}
    Analise: "${description}"
    Config: Assistir Todo Dia = ${isWatchEveryDay}, Prioridade = ${priorityValue}.
  `;

  const result = await model.generateContent(prompt);
  const data = JSON.parse(result.response.text());
  
  if (isWatchEveryDay && priorityValue) {
    const prefix = priorityValue.toString().padStart(2, '0');
    data.suggestedFilename = `[${prefix}] ${data.suggestedFilename}`;
  }

  return data as VideoAnalysis;
};

export async function generateEmbedding(text: string) {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values; // Retorna o array de números
}

export const analyzeFile = async (
fileBase64: string, mimeType: string, isWatchEveryDay: boolean, priorityValue?: number, promptCustomizado?: string | undefined): Promise<VideoAnalysis> => {
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  const prompt = `Analise este arquivo e aplique as regras de catalogação espiritual.`;

  const result = await model.generateContent([
    { text: prompt },
    { inlineData: { data: fileBase64, mimeType } }
  ]);

  const response = await result.response;
  const data = JSON.parse(response.text());

  if (isWatchEveryDay && priorityValue) {
    const prefix = priorityValue.toString().padStart(2, '0');
    data.suggestedFilename = `[${prefix}] ${data.suggestedFilename}`;
  }

  return data as VideoAnalysis;
};