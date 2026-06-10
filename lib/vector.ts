import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const EMBEDDING_DIMENSIONS = 768;

type CatalogMatch = {
  id: string;
  fileName: string;
  summary: string;
  author: string | null;
  similarity: number;
};

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
