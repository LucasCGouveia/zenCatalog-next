import mammoth from "mammoth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse/lib/pdf-parse.js";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function titleFromFileName(fileName: string) {
  return (
    fileName
      .replace(/\.[^.]+$/i, "")
      .replace(/[_-]+/g, " ")
      .trim()
      .slice(0, 120) || "Nota importada"
  );
}

function extensionFromFileName(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function isLikelyHeading(line: string) {
  const words = line.split(/\s+/).filter(Boolean);
  if (line.length > 90 || words.length > 12) return false;
  if (/[.!?;,]$/.test(line)) return false;
  if (/^[-*+]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) return false;

  const letters = line.replace(/[^A-Za-zÀ-ÿ]/g, "");
  const upperLetters = letters.replace(/[^A-ZÀ-Ý]/g, "");
  return (
    words.length <= 6 ||
    (letters.length >= 4 && upperLetters.length / letters.length > 0.75) ||
    /:$/.test(line)
  );
}

function markdownFromPlainText(text: string) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim());

  const output: string[] = [];
  let paragraph: string[] = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    output.push(paragraph.join(" "));
    paragraph = [];
  }

  for (const line of lines) {
    if (!line) {
      flushParagraph();
      continue;
    }

    const bullet = line.match(/^[•*-]\s+(.+)/);
    if (bullet) {
      flushParagraph();
      output.push(`- ${bullet[1]}`);
      continue;
    }

    const numbered = line.match(/^(\d+)[.)]\s+(.+)/);
    if (numbered) {
      flushParagraph();
      output.push(`${numbered[1]}. ${numbered[2]}`);
      continue;
    }

    if (isLikelyHeading(line)) {
      flushParagraph();
      output.push(`## ${line.replace(/:$/, "")}`);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return output.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function extractText(file: File, buffer: Buffer) {
  const extension = extensionFromFileName(file.name);

  if (extension === "md" || extension === "markdown") {
    return buffer.toString("utf-8");
  }

  if (extension === "txt") {
    return markdownFromPlainText(buffer.toString("utf-8"));
  }

  if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return markdownFromPlainText(result.value);
  }

  if (extension === "pdf") {
    const result = await pdf(buffer);
    return markdownFromPlainText(result.text);
  }

  throw new Error("Formato nao suportado. Use .txt, .md, .docx ou .pdf");
}

async function getTargetFolder(userId: string, folderId: string) {
  if (folderId) {
    return prisma.folder.findFirst({
      where: { id: folderId, userId },
      select: { id: true },
    });
  }

  const existing = await prisma.folder.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (existing) return existing;

  return prisma.folder.create({
    data: { name: "Importadas", userId },
    select: { id: true },
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folderId = String(formData.get("folderId") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Envie um arquivo para importar" }, { status: 400 });
  }

  const folder = await getTargetFolder(session.user.id, folderId);
  if (!folder) {
    return NextResponse.json({ error: "Pasta nao encontrada" }, { status: 404 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const content = (await extractText(file, buffer)).trim();

    if (!content) {
      return NextResponse.json(
        { error: "Nao encontrei texto nesse arquivo" },
        { status: 400 },
      );
    }

    const note = await prisma.note.create({
      data: {
        folderId: folder.id,
        title: titleFromFileName(file.name),
        content,
        position:
          ((await prisma.note.aggregate({
            where: { folderId: folder.id },
            _max: { position: true },
          }))._max.position ?? -1) + 1,
      },
    });

    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel importar o arquivo",
      },
      { status: 400 },
    );
  }
}
