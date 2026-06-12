import { jsPDF } from "jspdf";

type ExportNoteInput = {
  title: string;
  content: string;
  folderName?: string;
};

type TextStyle = {
  fontSize: number;
  fontStyle?: "normal" | "bold" | "italic";
  color?: [number, number, number];
  indent?: number;
  spacingBefore?: number;
  spacingAfter?: number;
  prefix?: string;
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_X = 20;
const MARGIN_TOP = 22;
const MARGIN_BOTTOM = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const FONT_FILES = {
  normal: "/fonts/NotoSans-Regular.ttf",
  bold: "/fonts/NotoSans-Bold.ttf",
  italic: "/fonts/NotoSans-Italic.ttf",
} as const;

let fontDataPromise: Promise<Record<keyof typeof FONT_FILES, string>> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

async function loadFonts() {
  if (!fontDataPromise) {
    fontDataPromise = Promise.all(
      Object.entries(FONT_FILES).map(async ([style, path]) => {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Não foi possível carregar a fonte ${path}.`);
        return [style, arrayBufferToBase64(await response.arrayBuffer())] as const;
      }),
    ).then((entries) => Object.fromEntries(entries) as Record<keyof typeof FONT_FILES, string>);
  }

  return fontDataPromise;
}

function cleanInlineMarkdown(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function safeFileName(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "anotacao";
}

export async function exportNoteToPdf({ title, content, folderName }: ExportNoteInput) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const fonts = await loadFonts();

  pdf.addFileToVFS("NotoSans-Regular.ttf", fonts.normal);
  pdf.addFileToVFS("NotoSans-Bold.ttf", fonts.bold);
  pdf.addFileToVFS("NotoSans-Italic.ttf", fonts.italic);
  pdf.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  pdf.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");
  pdf.addFont("NotoSans-Italic.ttf", "NotoSans", "italic");

  let cursorY = MARGIN_TOP;
  let isCodeBlock = false;

  function addPage() {
    pdf.addPage();
    cursorY = MARGIN_TOP;
  }

  function ensureSpace(height: number) {
    if (cursorY + height > PAGE_HEIGHT - MARGIN_BOTTOM) addPage();
  }

  function addText(value: string, style: TextStyle) {
    const text = cleanInlineMarkdown(value);
    if (!text) {
      cursorY += style.spacingAfter ?? 2.5;
      return;
    }

    const indent = style.indent ?? 0;
    const prefix = style.prefix ?? "";
    const availableWidth = CONTENT_WIDTH - indent;
    const lineHeight = style.fontSize * 0.43;

    cursorY += style.spacingBefore ?? 0;
    pdf.setFont("NotoSans", style.fontStyle ?? "normal");
    pdf.setFontSize(style.fontSize);
    pdf.setTextColor(...(style.color ?? [51, 65, 85]));

    const lines = pdf.splitTextToSize(`${prefix}${text}`, availableWidth) as string[];
    for (const line of lines) {
      ensureSpace(lineHeight + 1);
      pdf.text(line, MARGIN_X + indent, cursorY);
      cursorY += lineHeight;
    }

    cursorY += style.spacingAfter ?? 2.5;
  }

  pdf.setFillColor(37, 99, 235);
  pdf.rect(0, 0, PAGE_WIDTH, 9, "F");
  addText(title || "Anotação", {
    fontSize: 22,
    fontStyle: "bold",
    color: [15, 23, 42],
    spacingAfter: 3,
  });

  const metadata = [
    folderName ? `Pasta: ${folderName}` : null,
    `Exportado em ${new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date())}`,
  ]
    .filter(Boolean)
    .join("  •  ");

  addText(metadata, {
    fontSize: 9,
    color: [100, 116, 139],
    spacingAfter: 7,
  });

  pdf.setDrawColor(203, 213, 225);
  pdf.line(MARGIN_X, cursorY, PAGE_WIDTH - MARGIN_X, cursorY);
  cursorY += 7;

  const lines = (content || "Nenhum conteúdo ainda.").replace(/\r\n/g, "\n").split("\n");

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (trimmed.startsWith("```")) {
      isCodeBlock = !isCodeBlock;
      cursorY += 2;
      continue;
    }

    if (isCodeBlock) {
      addText(rawLine || " ", {
        fontSize: 9,
        color: [30, 41, 59],
        indent: 4,
        spacingAfter: 1,
      });
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      addText(heading[2], {
        fontSize: level === 1 ? 18 : level === 2 ? 15 : 12,
        fontStyle: "bold",
        color: [15, 23, 42],
        spacingBefore: level === 1 ? 5 : 3,
        spacingAfter: 3,
      });
      continue;
    }

    const unorderedItem = trimmed.match(/^[-*+]\s+(.+)$/);
    if (unorderedItem) {
      addText(unorderedItem[1], {
        fontSize: 11,
        indent: 5,
        prefix: "• ",
        spacingAfter: 2,
      });
      continue;
    }

    const orderedItem = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (orderedItem) {
      addText(orderedItem[2], {
        fontSize: 11,
        indent: 5,
        prefix: `${orderedItem[1]}. `,
        spacingAfter: 2,
      });
      continue;
    }

    if (trimmed.startsWith(">")) {
      addText(trimmed.replace(/^>\s?/, ""), {
        fontSize: 11,
        fontStyle: "italic",
        color: [71, 85, 105],
        indent: 5,
        prefix: "“",
        spacingAfter: 3,
      });
      continue;
    }

    if (/^([-*_])\1{2,}$/.test(trimmed)) {
      ensureSpace(5);
      pdf.setDrawColor(203, 213, 225);
      pdf.line(MARGIN_X, cursorY, PAGE_WIDTH - MARGIN_X, cursorY);
      cursorY += 5;
      continue;
    }

    addText(trimmed, {
      fontSize: 11,
      spacingAfter: trimmed ? 3 : 2,
    });
  }

  const totalPages = pdf.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);
    pdf.setFont("NotoSans", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(
      `ZenCatalog • Página ${page} de ${totalPages}`,
      PAGE_WIDTH / 2,
      PAGE_HEIGHT - 9,
      { align: "center" },
    );
  }

  pdf.save(`${safeFileName(title)}.pdf`);
}
