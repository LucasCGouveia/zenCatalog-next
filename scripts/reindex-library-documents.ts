import "dotenv/config";
import { prisma } from "../lib/prisma";
import {
  extractDocumentText,
  splitDocumentIntoChunks,
} from "../src/biblioteca-documentos/services/documentService";
import { generateEmbeddings } from "../src/catalogo/services/geminiService";
import { setDocumentChunkEmbedding } from "../lib/vector";

async function reindexDocument(document: {
  id: string;
  name: string;
  mimeType: string;
  data: Uint8Array;
}) {
  console.log(`Reindexando ${document.name}...`);
  const extractedText = await extractDocumentText(
    Buffer.from(document.data),
    document.mimeType,
  );
  const chunks = splitDocumentIntoChunks(extractedText);
  const embeddings = await generateEmbeddings(
    chunks.map(
      (content) => `Documento: ${document.name}\nTrecho: ${content}`,
    ),
  );

  await prisma.libraryDocument.update({
    where: { id: document.id },
    data: {
      extractedText,
      summary: extractedText.slice(0, 500),
      status: "PROCESSING",
    },
  });
  await prisma.libraryDocumentChunk.deleteMany({
    where: { documentId: document.id },
  });
  await prisma.libraryDocumentChunk.createMany({
    data: chunks.map((content, position) => ({
      documentId: document.id,
      position,
      content,
    })),
  });

  const savedChunks = await prisma.libraryDocumentChunk.findMany({
    where: { documentId: document.id },
    orderBy: { position: "asc" },
    select: { id: true },
  });

  for (const [index, chunk] of savedChunks.entries()) {
    await setDocumentChunkEmbedding(chunk.id, embeddings[index]);
  }

  await prisma.libraryDocument.update({
    where: { id: document.id },
    data: { status: "READY" },
  });
  console.log(
    `${document.name}: ${extractedText.length} caracteres, ${chunks.length} trechos.`,
  );
}

async function main() {
  const documents = await prisma.libraryDocument.findMany({
    select: {
      id: true,
      name: true,
      mimeType: true,
      data: true,
    },
    orderBy: { createdAt: "asc" },
  });

  for (const document of documents) {
    try {
      await reindexDocument(document);
    } catch (error) {
      await prisma.libraryDocument.update({
        where: { id: document.id },
        data: { status: "ERROR" },
      });
      console.error(`Falha ao reindexar ${document.name}:`, error);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
