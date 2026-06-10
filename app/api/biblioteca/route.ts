import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateEmbeddings } from "@/src/catalogo/services/geminiService";
import {
  extractDocumentText,
  inferFileType,
  splitDocumentIntoChunks,
  supportedDocumentTypes,
} from "@/src/biblioteca-documentos/services/documentService";
import { setDocumentChunkEmbedding } from "@/lib/vector";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const runtime = "nodejs";
export const maxDuration = 300;

function resolveMimeType(file: File) {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv",
    txt: "text/plain",
    md: "text/markdown",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  return extension ? types[extension] ?? "" : "";
}

async function authenticatedUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await authenticatedUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const documents = await prisma.libraryDocument.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      mimeType: true,
      fileType: true,
      size: true,
      summary: true,
      status: true,
      createdAt: true,
      _count: { select: { chunks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(request: Request) {
  const userId = await authenticatedUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let documentId: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Selecione um arquivo." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "O arquivo deve ter no máximo 10 MB." }, { status: 400 });
    }
    const mimeType = resolveMimeType(file);
    if (!supportedDocumentTypes.has(mimeType)) {
      return NextResponse.json({ error: "Formato de arquivo não suportado." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extractedText = await extractDocumentText(buffer, mimeType);
    const chunks = splitDocumentIntoChunks(extractedText);
    const summary = extractedText.slice(0, 500);

    const document = await prisma.libraryDocument.create({
      data: {
        userId,
        name: file.name,
        mimeType,
        fileType: inferFileType(mimeType),
        size: file.size,
        data: buffer,
        extractedText,
        summary,
        status: "PROCESSING",
      },
    });
    documentId = document.id;

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
      select: { id: true, content: true },
    });
    const embeddings = await generateEmbeddings(
      savedChunks.map(
        (chunk) => `Documento: ${file.name}\nTrecho: ${chunk.content}`,
      ),
    );
    for (const [index, chunk] of savedChunks.entries()) {
      await setDocumentChunkEmbedding(chunk.id, embeddings[index]);
    }

    await prisma.libraryDocument.update({
      where: { id: document.id },
      data: { status: "READY" },
    });

    return NextResponse.json({ success: true, id: document.id });
  } catch (error) {
    if (documentId) {
      await prisma.libraryDocument.delete({ where: { id: documentId } }).catch(() => undefined);
    }
    const message = error instanceof Error ? error.message : "Erro ao processar arquivo.";
    console.error("Erro no upload documental:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const userId = await authenticatedUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID ausente" }, { status: 400 });

  const result = await prisma.libraryDocument.deleteMany({ where: { id, userId } });
  if (!result.count) return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
  return NextResponse.json({ success: true });
}
