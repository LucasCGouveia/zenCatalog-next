'use server'

import { YoutubeTranscript } from 'youtube-transcript';
import { analyzeContent } from '../services/geminiService';
import { CatalogService } from '../services/catalogService';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const PROMPT_SISTEMA = `
Você é o Curador Digital ZenCatalog. Organize o acervo do Lucas.

### CATEGORIAS VÁLIDAS:
- [ESP]: Espiritismo
- [HIST]: Histórias
- [FILO]: Filosofia
- [DICA]: Tutoriais/Dicas
- [POEMA]: Poesia
- [FAMILY]: Vida e Família
- [É Ela]: Dicas Guerreiro
- [OUTROS]: Diversos

### REGRAS:
- Use [01] apenas se for continuação ou muito importante (FAMILY/É Ela/Tutoriais).
- Formato: [NUMERO?] [CATEGORIA] Subcategoria - Assunto - Autor.mp4
`;

function getYoutubeVideoId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Função auxiliar para pegar Título/Autor sem API Key (OEmbed)
async function getYoutubeMetadata(videoId: string) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (res.ok) {
      const data = await res.json();
      return { title: data.title, author: data.author_name };
    }
  } catch (error) {
    console.error("Falha ao buscar metadados OEmbed:", error);
  }
  return null;
}

export async function processYoutubeLink(url: string, userDescription: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");

  try {
    const videoId = getYoutubeVideoId(url);
    if (!videoId) throw new Error("Link inválido");

    let textContent = "";
    
    // 1. Tenta pegar Legendas (Transcrição)
    try {
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt' })
        .catch(() => YoutubeTranscript.fetchTranscript(videoId)); // Tenta auto-detect se pt falhar
        
      const fullText = transcriptItems.map(t => t.text).join(' ');
      if (fullText) {
        textContent = `TRANSCRIÇÃO COMPLETA:\n${fullText}`;
      }
    } catch (e) {
      console.warn("Legenda indisponível, tentando metadados...", e);
    }

    // 2. Se não conseguiu legenda, busca metadados básicos (Título/Canal)
    if (!textContent) {
      const metadata = await getYoutubeMetadata(videoId);
      if (metadata) {
        textContent = `
        ATENÇÃO: ESTE VÍDEO NÃO POSSUI LEGENDAS. ANALISE APENAS PELOS DADOS ABAIXO:
        
        TÍTULO DO VÍDEO: ${metadata.title}
        CANAL/AUTOR: ${metadata.author}
        
        (Use o 'CONTEXTO DO USUÁRIO' para enriquecer a análise)
        `;
      } else {
        // Se falhar tudo, usa apenas o que o usuário digitou
        if (!userDescription) throw new Error("Vídeo sem legenda e sem metadados. Adicione uma descrição manual para prosseguir.");
        textContent = `VÍDEO SEM DADOS. ANALISE APENAS PELA DESCRIÇÃO DO USUÁRIO.`;
      }
    }

    // 3. Envia para o Gemini
    const analysis = await analyzeContent({
      transcriptText: textContent,
      isWatchEveryDay: false,
      userDescription,
      customPrompt: PROMPT_SISTEMA
    });

    // 4. Salva
    const savedItem = await CatalogService.save({
      ...analysis,
      fileName: analysis.suggestedFilename,
      videoUrl: url,
      sourceType: 'URL',
      mimeType: 'video/youtube',
    }, session.user.id);

    return { success: true, data: savedItem };

  } catch (error: any) {
    console.error("Erro YouTube:", error);
    return { success: false, error: error.message || "Erro ao processar" };
  }
}