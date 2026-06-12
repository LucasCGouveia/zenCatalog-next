import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const EMBEDDING_DIMENSIONS = 768;

export type CatalogMatch = {
  id: string;
  fileName: string;
  summary: string;
  author: string | null;
  similarity: number;
};

export type DocumentMatch = {
  id: string;
  documentId: string;
  documentName: string;
  fileType: string;
  content: string;
  similarity: number;
};

const SEARCH_STOP_WORDS = new Set([
  "aula",
  "base",
  "como",
  "com",
  "dar",
  "dos",
  "das",
  "para",
  "pela",
  "pelo",
  "que",
  "sobre",
  "uma",
  "vou",
]);

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function searchKeywords(query: string) {
  return Array.from(
    new Set(
      normalizeSearchText(query)
        .split(/[^a-z0-9]+/)
        .filter(
          (word) =>
            word.length >= 4 &&
            !SEARCH_STOP_WORDS.has(word),
        ),
    ),
  ).slice(0, 10);
}

function toVectorLiteral(embedding: number[]) {
  if (
    embedding.length !== EMBEDDING_DIMENSIONS ||
    embedding.some((value) => !Number.isFinite(value))
  ) {
    throw new Error(
      `Embedding invalido: esperado vetor com ${EMBEDDING_DIMENSIONS} valores finitos.`,
    );
  }

  return `[${embedding.join(",")}]`;
}

export async function setCatalogEmbedding(
  catalogId: string,
  embedding: number[],
) {
  const vector = toVectorLiteral(embedding);

  await prisma.$executeRaw`
    UPDATE "Catalog"
    SET "embedding" = CAST(${vector} AS vector)
    WHERE "id" = ${catalogId}
  `;
}

export async function setDocumentChunkEmbedding(
  chunkId: string,
  embedding: number[],
) {
  const vector = toVectorLiteral(embedding);

  await prisma.$executeRaw`
    UPDATE "LibraryDocumentChunk"
    SET "embedding" = CAST(${vector} AS vector)
    WHERE "id" = ${chunkId}
  `;
}

export async function findSimilarCatalogs(
  userId: string,
  embedding: number[],
  limit = 5,
) {
  const vector = toVectorLiteral(embedding);
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 20));

  return prisma.$queryRaw<CatalogMatch[]>(Prisma.sql`
    SELECT
      "id",
      "fileName",
      "summary",
      "author",
      1 - ("embedding" <=> CAST(${vector} AS vector)) AS "similarity"
    FROM "Catalog"
    WHERE "userId" = ${userId}
      AND "embedding" IS NOT NULL
    ORDER BY "embedding" <=> CAST(${vector} AS vector)
    LIMIT ${safeLimit}
  `);
}

export async function findSimilarDocumentChunks(
  userId: string,
  embedding: number[],
  limit = 16,
) {
  const vector = toVectorLiteral(embedding);
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 20));

  return prisma.$queryRaw<DocumentMatch[]>(Prisma.sql`
    SELECT
      chunk."id",
      chunk."documentId",
      document."name" AS "documentName",
      document."fileType",
      chunk."content",
      1 - (chunk."embedding" <=> CAST(${vector} AS vector)) AS "similarity"
    FROM "LibraryDocumentChunk" chunk
    INNER JOIN "LibraryDocument" document
      ON document."id" = chunk."documentId"
    WHERE document."userId" = ${userId}
      AND document."status" = 'READY'
      AND chunk."embedding" IS NOT NULL
    ORDER BY chunk."embedding" <=> CAST(${vector} AS vector)
    LIMIT ${safeLimit}
  `);
}

export async function findDocumentChunksByText(
  userId: string,
  query: string,
  limit = 8,
) {
  const keywords = searchKeywords(query);
  if (!keywords.length) return [];

  const candidates = await prisma.libraryDocumentChunk.findMany({
    where: {
      document: {
        userId,
        status: "READY",
      },
      OR: keywords.map((keyword) => ({
        content: { contains: keyword, mode: "insensitive" as const },
      })),
    },
    select: {
      id: true,
      documentId: true,
      content: true,
      document: {
        select: {
          name: true,
          fileType: true,
        },
      },
    },
    take: 250,
  });

  const normalizedQuery = normalizeSearchText(query);
  const significantPhrase = keywords.slice(-5).join(" ");

  return candidates
    .map((candidate) => {
      const normalizedContent = normalizeSearchText(candidate.content);
      const keywordScore = keywords.reduce(
        (score, keyword) =>
          score + (normalizedContent.includes(keyword) ? 1 : 0),
        0,
      );
      const phraseScore =
        significantPhrase.length > 12 &&
        normalizedContent.includes(significantPhrase)
          ? 5
          : 0;
      const exactQueryScore = normalizedContent.includes(normalizedQuery) ? 8 : 0;
      const referencePenalty =
        /\b(sumario|indice geral)\b/.test(normalizedContent) ? 3 : 0;

      return {
        id: candidate.id,
        documentId: candidate.documentId,
        documentName: candidate.document.name,
        fileType: candidate.document.fileType,
        content: candidate.content,
        similarity:
          1 + keywordScore + phraseScore + exactQueryScore - referencePenalty,
      };
    })
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, Math.max(1, Math.min(Math.trunc(limit), 20)));
}
