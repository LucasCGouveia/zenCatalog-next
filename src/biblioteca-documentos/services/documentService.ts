import { GoogleGenerativeAI } from "@google/generative-ai";
import ExcelJS from "exceljs";
import mammoth from "mammoth";
import pdf from "pdf-parse/lib/pdf-parse.js";

const MAX_EXTRACTED_CHARACTERS = 120_000;
const CHUNK_SIZE = 1_600;
const CHUNK_OVERLAP = 240;
const MAX_CHUNKS = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const supportedDocumentTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "text/markdown",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function normalizeText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_EXTRACTED_CHARACTERS);
}

async function extractImageText(buffer: Buffer, mimeType: string) {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  });
  const result = await model.generateContent([
    {
      text:
        "Extraia todo o texto legível desta imagem. Depois descreva de forma objetiva " +
        "diagramas, tabelas, objetos e informações relevantes. Responda somente com o conteúdo extraído.",
    },
    {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType,
      },
    },
  ]);
  return result.response.text();
}

async function extractSpreadsheetText(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
  );
  const sheets: string[] = [];

  workbook.eachSheet((sheet) => {
    const rows: string[] = [];
    sheet.eachRow((row) => {
      const cells: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        cells.push(String(cell.text ?? "").replace(/\s+/g, " ").trim());
      });
      rows.push(cells.join(" | "));
    });
    sheets.push(`PLANILHA: ${sheet.name}\n${rows.join("\n")}`);
  });

  return sheets.join("\n\n");
}

export function inferFileType(mimeType: string) {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.includes("wordprocessingml")) return "DOCUMENT";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  ) {
    return "SPREADSHEET";
  }
  if (mimeType.startsWith("image/")) return "IMAGE";
  return "TEXT";
}

export async function extractDocumentText(
  buffer: Buffer,
  mimeType: string,
) {
  let text = "";

  if (mimeType === "application/pdf") {
    text = (await pdf(buffer)).text;
  } else if (mimeType.includes("wordprocessingml")) {
    text = (await mammoth.extractRawText({ buffer })).value;
  } else if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  ) {
    text =
      mimeType === "text/csv"
        ? buffer.toString("utf8")
        : await extractSpreadsheetText(buffer);
  } else if (mimeType.startsWith("image/")) {
    text = await extractImageText(buffer, mimeType);
  } else {
    text = buffer.toString("utf8");
  }

  const normalized = normalizeText(text);
  if (normalized.length < 20) {
    throw new Error("Não foi possível extrair conteúdo suficiente do arquivo.");
  }
  return normalized;
}

export function splitDocumentIntoChunks(text: string) {
  const chunks: string[] = [];

  for (
    let start = 0;
    start < text.length && chunks.length < MAX_CHUNKS;
    start += CHUNK_SIZE - CHUNK_OVERLAP
  ) {
    let end = Math.min(start + CHUNK_SIZE, text.length);
    if (end < text.length) {
      const boundary = Math.max(
        text.lastIndexOf("\n\n", end),
        text.lastIndexOf(". ", end),
      );
      if (boundary > start + CHUNK_SIZE / 2) end = boundary + 1;
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= text.length) break;
  }

  return chunks;
}
