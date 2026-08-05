import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  CatalogProcessingError,
  authenticateN8nCatalogUser,
  jsonError,
} from "@/src/catalogo/services/processCatalogVideo";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ catalogId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await authenticateN8nCatalogUser(request);
    const { catalogId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const driveFileId = typeof body.driveFileId === "string" ? body.driveFileId.trim() : "";
    const finalName = typeof body.finalName === "string" ? body.finalName.trim() : "";

    if (!driveFileId) {
      throw new CatalogProcessingError(
        "DRIVE_FILE_ID_REQUIRED",
        "O campo driveFileId é obrigatório.",
        400,
        false,
      );
    }

    if (!finalName) {
      throw new CatalogProcessingError(
        "FINAL_NAME_REQUIRED",
        "O campo finalName é obrigatório.",
        400,
        false,
      );
    }

    const catalog = await prisma.catalog.findFirst({
      where: {
        id: catalogId,
        userId: user.id,
      },
      select: {
        id: true,
        driveFileId: true,
      },
    });

    if (!catalog) {
      throw new CatalogProcessingError(
        "CATALOG_NOT_FOUND",
        "Catálogo não encontrado para o usuário de integração.",
        404,
        false,
      );
    }

    if (catalog.driveFileId !== driveFileId) {
      throw new CatalogProcessingError(
        "DRIVE_FILE_ID_MISMATCH",
        "O driveFileId informado não corresponde ao catálogo.",
        400,
        false,
      );
    }

    const updated = await prisma.catalog.update({
      where: { id: catalog.id },
      data: {
        fileName: finalName,
        processingStatus: "COMPLETED",
        processingError: null,
        processedAt: new Date(),
      },
      select: {
        id: true,
        driveFileId: true,
        fileName: true,
        processingStatus: true,
        processedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      catalogId: updated.id,
      driveFileId: updated.driveFileId,
      finalName: updated.fileName,
      processingStatus: updated.processingStatus,
      processedAt: updated.processedAt,
    });
  } catch (error) {
    const { body, status } = jsonError(error);
    return NextResponse.json(body, { status });
  }
}
