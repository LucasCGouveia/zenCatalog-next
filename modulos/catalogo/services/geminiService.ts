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
    duration: {
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

export async function generateEmbedding(text: string) {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values; // Retorna o array de números
}

export const analyzeFile = async (
  fileBase64: string,
  mimeType: string,
  isWatchEveryDay: boolean,
  priorityValue?: number,
  userDescription?: string,
  customPrompt?: string // Parâmetro recebido da API
): Promise<VideoAnalysis> => {

  // Instrução mestre: Se houver prompt customizado, ele manda.
  const promptFinal = `
  ${customPrompt}
  
  INSTRUÇÃO ADICIONAL DE TEMPO:
  Analise o vídeo por completo. Observe o contador de tempo interno (se disponível) ou a progressão do conteúdo. 
  Forneça uma estimativa de duração no formato MM:SS.
  
  CONTEXTO DO USUÁRIO: "${userDescription}"
`;

  const result = await model.generateContent([
    { text: promptFinal },
    { inlineData: { data: fileBase64, mimeType } }
  ]);

  const data = JSON.parse(result.response.text());

  // Lógica de prioridade no nome do arquivo (opcional)
  if (isWatchEveryDay && priorityValue) {
    const prefix = priorityValue.toString().padStart(2, '0');
    data.suggestedFilename = `[${prefix}] ${data.suggestedFilename}`;
  }

  return data as VideoAnalysis;
};