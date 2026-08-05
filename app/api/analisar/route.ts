import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processCatalogVideo } from "@/src/catalogo/services/processCatalogVideo";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      description,
      duration,
      fileBase64,
      fileMimeType,
      fileName,
      isWatchEveryDay,
      priorityValue,
    } = body;

    if (!fileBase64) {
      throw new Error("O envio de um arquivo de vídeo é obrigatório.");
    }

    const result = await processCatalogVideo({
      contentBase64: fileBase64,
      fileName: fileName || "upload_video",
      mimeType: fileMimeType,
      description,
      duration,
      isWatchEveryDay,
      priorityValue,
      userId: session.user.id,
    });

    const savedItem = await prisma.catalog.findUnique({
      where: { id: result.catalogId },
    });

    return NextResponse.json(savedItem);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    console.error("Erro na API:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
