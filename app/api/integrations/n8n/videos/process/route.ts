import { NextResponse } from "next/server";
import {
  ALLOWED_N8N_VIDEO_MIME_TYPES,
  CatalogProcessingError,
  MAX_N8N_VIDEO_UPLOAD_BYTES,
  authenticateN8nCatalogUser,
  jsonError,
  normalizeBoolean,
  normalizeInteger,
  processCatalogVideo,
} from "@/src/catalogo/services/processCatalogVideo";

export const runtime = "nodejs";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const user = await authenticateN8nCatalogUser(request);
    const formData = await request.formData();
    const file = formData.get("file");
    const driveFileId = getString(formData, "driveFileId");
    const originalName = getString(formData, "originalName");
    const declaredMimeType = getString(formData, "mimeType");

    if (!(file instanceof File)) {
      throw new CatalogProcessingError(
        "FILE_REQUIRED",
        "O campo multipart file é obrigatório.",
        400,
        false,
      );
    }

    if (!driveFileId) {
      throw new CatalogProcessingError(
        "DRIVE_FILE_ID_REQUIRED",
        "O campo driveFileId é obrigatório.",
        400,
        false,
      );
    }

    const mimeType = declaredMimeType || file.type;
    const receivedMimeType = file.type || mimeType;

    if (
      !ALLOWED_N8N_VIDEO_MIME_TYPES.has(mimeType) ||
      !ALLOWED_N8N_VIDEO_MIME_TYPES.has(receivedMimeType)
    ) {
      throw new CatalogProcessingError(
        "INVALID_MIME_TYPE",
        "Tipo MIME de vídeo inválido.",
        400,
        false,
      );
    }

    if (file.size > MAX_N8N_VIDEO_UPLOAD_BYTES) {
      throw new CatalogProcessingError(
        "FILE_TOO_LARGE",
        "O arquivo excede o limite máximo de 50 MB.",
        413,
        false,
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processCatalogVideo({
      buffer,
      fileName: file.name || originalName || "video",
      driveOriginalName: originalName || file.name || "video",
      mimeType,
      driveFileId,
      description: getString(formData, "description") || undefined,
      duration: getString(formData, "duration") || undefined,
      isWatchEveryDay: normalizeBoolean(formData.get("isWatchEveryDay"), false),
      priorityValue: normalizeInteger(formData.get("priorityValue"), 1),
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        alreadyProcessed: result.alreadyProcessed,
        catalogId: result.catalogId,
        driveFileId: result.driveFileId || driveFileId,
        originalName: result.originalName,
        suggestedFileName: result.suggestedFileName,
        catalog: result.catalog,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[N8N_VIDEO_PROCESS_ERROR]", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined,
    });

    const { body, status } = jsonError(error);
    return NextResponse.json(body, { status });
  }
}
