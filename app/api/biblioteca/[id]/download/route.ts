import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const document = await prisma.libraryDocument.findFirst({
    where: { id, userId: session.user.id },
    select: { name: true, mimeType: true, data: true },
  });
  if (!document) {
    return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
  }

  return new NextResponse(document.data, {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.name)}`,
    },
  });
}
