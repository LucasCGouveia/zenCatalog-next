import type { CatalogMatch, DocumentMatch } from "@/lib/vector";

type ConversationMessage = {
  role: string;
  content: string;
};

const DOCUMENT_SIMILARITY_THRESHOLD = 0.52;
const VIDEO_SIMILARITY_THRESHOLD = 0.5;

function isContinuationQuestion(question: string) {
  return (
    question.length < 55 ||
    /\b(isso|isto|essa|esse|anterior|acima|refa[çc]a|recrie|continue|melhore|ajuste|recomendou|mesma aula|gostei)\b/i.test(
      question,
    )
  );
}

export function buildRetrievalQuery(
  question: string,
  messages: ConversationMessage[],
) {
  if (!isContinuationQuestion(question)) return question;

  const priorUserMessages = messages
    .filter((message) => message.role === "user")
    .slice(-3)
    .map((message) => message.content.trim())
    .filter(Boolean);

  return [...priorUserMessages, question].join("\n").slice(-2_500);
}

export function selectDocumentMatches(matches: DocumentMatch[]) {
  const selected: DocumentMatch[] = [];
  const chunksPerDocument = new Map<string, number>();

  for (const match of matches) {
    if (match.similarity < DOCUMENT_SIMILARITY_THRESHOLD) continue;
    const currentCount = chunksPerDocument.get(match.documentId) ?? 0;
    if (currentCount >= 4) continue;

    selected.push(match);
    chunksPerDocument.set(match.documentId, currentCount + 1);
    if (selected.length >= 8) break;
  }

  return selected;
}

export function selectVideoMatches(matches: CatalogMatch[]) {
  return matches
    .filter((match) => match.similarity >= VIDEO_SIMILARITY_THRESHOLD)
    .slice(0, 5);
}

export function formatSourceFooter(
  documents: DocumentMatch[],
  videos: CatalogMatch[],
) {
  const documentNames = Array.from(
    new Set(documents.map((document) => document.documentName)),
  );
  const videoNames = Array.from(new Set(videos.map((video) => video.fileName)));

  if (!documentNames.length && !videoNames.length) return "";

  const lines = [
    ...documentNames.map((name) => `- Documento: **${name}**`),
    ...videoNames.map((name) => `- Vídeo: **${name}**`),
  ];

  return `\n\n---\n### Fontes do acervo consultadas\n${lines.join("\n")}`;
}
