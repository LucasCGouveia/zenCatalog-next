import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { setCatalogEmbedding } from "@/lib/vector";
import {
  analyzeContent,
  generateEmbedding,
  uploadGeminiFileFromBuffer,
} from "./geminiService";

export const MAX_N8N_VIDEO_UPLOAD_BYTES = 50 * 1024 * 1024;

export const ALLOWED_N8N_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
]);

const DEFAULT_SYSTEM_PROMPT = `
Você é o Curador Digital ZenCatalog. Organize o acervo com precisão.
Categorias: [ESP], [HIST], [FILO], [DICA], [POEMA], [FAMILY], [É Ela], [OUTROS].
`;

type ProcessCatalogVideoInput = {
  buffer?: Buffer;
  contentBase64?: string;
  fileName: string;
  mimeType: string;
  description?: string;
  duration?: string;
  isWatchEveryDay?: boolean;
  priorityValue?: number;
  userId: string;
  driveFileId?: string;
  driveOriginalName?: string;
};

export type ProcessCatalogVideoResult = {
  alreadyProcessed: boolean;
  catalogId: string;
  driveFileId?: string;
  originalName: string;
  suggestedFileName: string;
  catalog: {
    category: string;
    subcategory: string | null;
    subject: string | null;
    author: string | null;
    summary: string;
    mimeType: string | null;
  };
};

export class CatalogProcessingError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 500,
    public retryable = false,
  ) {
    super(message);
    this.name = "CatalogProcessingError";
  }
}

export function normalizeBoolean(value: FormDataEntryValue | null, defaultValue = false) {
  if (value === null) return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  return ["true", "1", "yes", "sim"].includes(normalized);
}

export function normalizeInteger(value: FormDataEntryValue | null, defaultValue: number) {
  if (value === null || String(value).trim() === "") return defaultValue;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

export function mapCatalogProcessingError(error: unknown) {
  if (error instanceof CatalogProcessingError) return error;

  const message = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : "";
  const lowerMessage = message.toLowerCase();
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : undefined;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return new CatalogProcessingError(
        "CATALOG_ALREADY_EXISTS",
        "Este vídeo já foi registrado para o usuário configurado.",
        409,
        false,
      );
    }

    if (error.code === "P2025") {
      return new CatalogProcessingError(
        "CATALOG_NOT_FOUND",
        "Registro não encontrado.",
        404,
        false,
      );
    }

    if (["P1001", "P1002", "P1008", "P1017", "P2024"].includes(error.code)) {
      return new CatalogProcessingError(
        "DATABASE_UNAVAILABLE",
        "O banco de dados está indisponível no momento.",
        503,
        true,
      );
    }

    return new CatalogProcessingError(
      "DATABASE_ERROR",
      "Erro ao acessar o banco de dados.",
      500,
      false,
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new CatalogProcessingError(
      "DATABASE_UNAVAILABLE",
      "O banco de dados está indisponível no momento.",
      503,
      true,
    );
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new CatalogProcessingError(
      "DATABASE_VALIDATION_ERROR",
      "Dados inválidos para gravação no banco.",
      500,
      false,
    );
  }

  if (
    lowerMessage.includes("multipart") ||
    lowerMessage.includes("formdata") ||
    lowerMessage.includes("form data") ||
    lowerMessage.includes("failed to parse body")
  ) {
    return new CatalogProcessingError(
      "INVALID_MULTIPART_FORM_DATA",
      "O corpo multipart/form-data é inválido.",
      400,
      false,
    );
  }

  if (
    status === 413 ||
    lowerMessage.includes("body exceeded") ||
    lowerMessage.includes("request entity too large") ||
    lowerMessage.includes("payload too large")
  ) {
    return new CatalogProcessingError(
      "FILE_TOO_LARGE",
      "O arquivo excede o limite máximo permitido.",
      413,
      false,
    );
  }

  if (
    status === 429 ||
    message.includes("429") ||
    lowerMessage.includes("quota") ||
    lowerMessage.includes("rate limit") ||
    lowerMessage.includes("resource_exhausted")
  ) {
    return new CatalogProcessingError(
      "GEMINI_QUOTA_EXCEEDED",
      "A cota do Gemini foi excedida.",
      429,
      true,
    );
  }

  if (
    status === 503 ||
    message.includes("503") ||
    lowerMessage.includes("unavailable") ||
    lowerMessage.includes("overloaded") ||
    lowerMessage.includes("temporarily unavailable")
  ) {
    return new CatalogProcessingError(
      "GEMINI_UNAVAILABLE",
      "O Gemini está indisponível no momento.",
      503,
      true,
    );
  }

  if (
    status === 400 ||
    lowerMessage.includes("invalid argument") ||
    lowerMessage.includes("unsupported mime") ||
    lowerMessage.includes("invalid mime")
  ) {
    return new CatalogProcessingError(
      "GEMINI_INVALID_REQUEST",
      "O Gemini recusou o arquivo ou os parâmetros enviados.",
      400,
      false,
    );
  }

  if (
    name.includes("GoogleGenerativeAI") ||
    lowerMessage.includes("gemini") ||
    lowerMessage.includes("generative")
  ) {
    return new CatalogProcessingError(
      "GEMINI_ERROR",
      "Erro ao processar o vídeo no Gemini.",
      502,
      true,
    );
  }

  return new CatalogProcessingError(
    "INTERNAL_ERROR",
    "Erro interno inesperado.",
    500,
    false,
  );
}

export function jsonError(error: unknown) {
  const mapped = mapCatalogProcessingError(error);
  return {
    body: {
      success: false,
      code: mapped.code,
      error: mapped.message,
      retryable: mapped.retryable,
    },
    status: mapped.status,
  };
}

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function authenticateN8nCatalogUser(request: Request) {
  const expectedApiKey = process.env.N8N_INTEGRATION_API_KEY;
  const token = getBearerToken(request);

  if (!expectedApiKey || !token || token !== expectedApiKey) {
    throw new CatalogProcessingError(
      "INVALID_N8N_API_KEY",
      "Chave de integração do n8n ausente ou inválida.",
      401,
      false,
    );
  }

  const email = process.env.N8N_CATALOG_USER_EMAIL;
  if (!email) {
    throw new CatalogProcessingError(
      "N8N_CATALOG_USER_EMAIL_NOT_CONFIGURED",
      "O e-mail do usuário de integração não foi configurado.",
      500,
      false,
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new CatalogProcessingError(
      "N8N_CATALOG_USER_NOT_FOUND",
      "Usuário de integração configurado não encontrado.",
      404,
      false,
    );
  }

  return user;
}

function getOriginalExtension(fileName: string, mimeType: string) {
  const match = fileName.match(/\.([a-z0-9]{1,10})$/i);
  if (match) return `.${match[1].toLowerCase()}`;

  const byMimeType: Record<string, string> = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "video/x-matroska": ".mkv",
  };

  return byMimeType[mimeType] || ".mp4";
}

function sanitizeFileName(fileName: string) {
  return fileName
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");
}

export function buildSuggestedFileName(suggestedFilename: string, originalName: string, mimeType: string) {
  const extension = getOriginalExtension(originalName, mimeType);
  const withoutExtension = suggestedFilename.replace(/\.[a-z0-9]{1,10}$/i, "");
  const sanitizedBase = sanitizeFileName(withoutExtension) || "video";
  return `${sanitizedBase}${extension}`;
}

async function getCombinedPrompt(userId: string) {
  const [user, existingFiles] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { systemPrompt: true },
    }),
    prisma.catalog.findMany({
      where: { userId },
      select: { fileName: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const existingFilesList = existingFiles.map((file) => file.fileName).join("\n");

  return `
      ${user?.systemPrompt || DEFAULT_SYSTEM_PROMPT}
      ### CONTEXTO DO ACERVO ATUAL:
      ${existingFilesList}
    `;
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function toResponse(catalog: {
  id: string;
  driveFileId: string | null;
  originalName: string | null;
  driveOriginalName: string | null;
  fileName: string;
  category: string;
  subcategory: string | null;
  subject: string | null;
  author: string | null;
  summary: string;
  mimeType: string | null;
}, alreadyProcessed: boolean): ProcessCatalogVideoResult {
  return {
    alreadyProcessed,
    catalogId: catalog.id,
    driveFileId: catalog.driveFileId || undefined,
    originalName: catalog.driveOriginalName || catalog.originalName || "",
    suggestedFileName: catalog.fileName,
    catalog: {
      category: catalog.category,
      subcategory: catalog.subcategory,
      subject: catalog.subject,
      author: catalog.author,
      summary: catalog.summary,
      mimeType: catalog.mimeType,
    },
  };
}

export async function processCatalogVideo(input: ProcessCatalogVideoInput) {
  const isWatchEveryDay = input.isWatchEveryDay ?? false;
  const priorityValue = input.priorityValue ?? 1;
  const originalName = input.driveOriginalName || input.fileName || "upload_video";
  let processingCatalogId: string | null = null;

  if (input.driveFileId) {
    const existing = await prisma.catalog.findFirst({
      where: { userId: input.userId, driveFileId: input.driveFileId },
    });

    if (existing?.processingStatus === "PROCESSING") {
      throw new CatalogProcessingError(
        "CATALOG_PROCESSING",
        "Este vídeo já está em processamento.",
        409,
        true,
      );
    }

    if (existing?.processingStatus === "COMPLETED") {
      return toResponse(existing, true);
    }

    if (existing?.processingStatus === "ERROR") {
      processingCatalogId = existing.id;
      await prisma.catalog.update({
        where: { id: existing.id },
        data: {
          processingStatus: "PROCESSING",
          processingError: null,
          driveOriginalName: originalName,
          originalName,
          mimeType: input.mimeType,
        },
      });
    } else {
      try {
        const processingCatalog = await prisma.catalog.create({
          data: {
            fileName: sanitizeFileName(originalName) || "video",
            originalName,
            driveFileId: input.driveFileId,
            driveOriginalName: originalName,
            processingStatus: "PROCESSING",
            processingError: null,
            summary: "",
            category: "",
            subcategory: "",
            subject: "",
            author: "",
            duration: input.duration,
            observations: input.description,
            isWatchEveryDay,
            priority: priorityValue,
            sourceType: "GOOGLE_DRIVE",
            mimeType: input.mimeType,
            userId: input.userId,
          },
        });
        processingCatalogId = processingCatalog.id;
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error;

        throw new CatalogProcessingError(
          "CATALOG_PROCESSING",
          "Este vídeo já está em processamento.",
          409,
          true,
        );
      }
    }
  }

  try {
    const combinedPrompt = await getCombinedPrompt(input.userId);
    const uploadedFile = input.buffer
      ? await uploadGeminiFileFromBuffer(input.buffer, input.mimeType, originalName)
      : null;

    const result = await analyzeContent({
      contentBase64: input.contentBase64,
      fileUri: uploadedFile?.uri,
      mimeType: input.mimeType,
      isWatchEveryDay,
      priorityValue,
      userDescription: input.description,
      customPrompt: combinedPrompt,
    });

    const finalDuration = input.duration || result.duration;
    const suggestedFileName = buildSuggestedFileName(
      result.suggestedFilename,
      originalName,
      input.mimeType,
    );
    const textToVectorize = `Conteúdo: ${result.summary} | Observações: ${input.description || ""}`;
    const embedding = await generateEmbedding(textToVectorize);

    const savedItem = processingCatalogId
      ? await prisma.catalog.update({
          where: { id: processingCatalogId },
          data: {
            fileName: suggestedFileName,
            originalName,
            driveOriginalName: input.driveFileId ? originalName : undefined,
            summary: result.summary,
            observations: input.description,
            category: result.category,
            subcategory: result.subcategory,
            subject: result.subject,
            author: result.author,
            duration: finalDuration,
            isWatchEveryDay,
            priority: priorityValue,
            sourceType: input.driveFileId ? "GOOGLE_DRIVE" : "FILE",
            mimeType: input.mimeType,
            processingStatus: input.driveFileId ? "PROCESSING" : "COMPLETED",
            processingError: null,
            processedAt: input.driveFileId ? null : new Date(),
          },
        })
      : await prisma.catalog.create({
          data: {
            fileName: suggestedFileName,
            originalName,
            summary: result.summary,
            observations: input.description,
            category: result.category,
            subcategory: result.subcategory,
            subject: result.subject,
            author: result.author,
            duration: finalDuration,
            isWatchEveryDay,
            priority: priorityValue,
            sourceType: "FILE",
            mimeType: input.mimeType,
            processingStatus: "COMPLETED",
            processedAt: new Date(),
            userId: input.userId,
          },
        });

    await setCatalogEmbedding(savedItem.id, embedding);
    return toResponse(savedItem, false);
  } catch (error) {
    if (processingCatalogId) {
      const message = error instanceof Error ? error.message : String(error);
      await prisma.catalog.update({
        where: { id: processingCatalogId },
        data: {
          processingStatus: "ERROR",
          processingError: message.slice(0, 2_000),
        },
      });
    }

    throw error;
  }
}
