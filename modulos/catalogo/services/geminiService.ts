import { GoogleGenerativeAI, SchemaType, ResponseSchema } from "@google/generative-ai";
import { Category, VideoAnalysis } from "../types";

// Pegando a chave do ambiente (Server Side)
const API_KEY = process.env.GEMINI_API_KEY || '';
console.log("DEBUG: A chave carregada é:", API_KEY ? "SUCESSO (começa com " + API_KEY.substring(0, 5) + ")" : "VAZIA");
const genAI = new GoogleGenerativeAI(API_KEY);

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
    }
  },
  required: ["category", "subcategory", "subject", "author", "suggestedFilename", "summary"]
};

export const analyzeContent = async (
  description: string, 
  isWatchEveryDay: boolean,
  priorityValue?: number
): Promise<VideoAnalysis> => {
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });
  
  const prompt = `
    Atue como um especialista em catalogação de vídeos de espiritualidade e educação.
    Analise: "${description}"
    Regras: [CATEGORIA] Subcategoria - Assunto - Autor.mp4
    Categorias: [ESP], [HIST], [FILO], [DICA], [POEMA].
    Config: Assistir Todo Dia = ${isWatchEveryDay}, Prioridade = ${priorityValue}.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const data = JSON.parse(response.text());
  
  if (isWatchEveryDay && priorityValue) {
    const prefix = priorityValue.toString().padStart(2, '0');
    data.suggestedFilename = `[${prefix}] ${data.suggestedFilename}`;
  }

  return data as VideoAnalysis;
};

export const analyzeFile = async (
  fileBase64: string, 
  mimeType: string, 
  isWatchEveryDay: boolean,
  priorityValue?: number
): Promise<VideoAnalysis> => {
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