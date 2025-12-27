import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { analyzeContent, analyzeFile } from '@/modulos/catalogo/services/geminiService';

// O Next.js pega a chave direto do seu .env.local no servidor
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, fileBase64, fileMimeType, isWatchEveryDay, priorityValue } = body;

    let result;
    if (fileBase64) {
      result = await analyzeFile(fileBase64, fileMimeType, isWatchEveryDay, priorityValue);
    } else {
      result = await analyzeContent(description, isWatchEveryDay, priorityValue);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erro na API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}