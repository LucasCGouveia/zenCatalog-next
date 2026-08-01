import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ImportedCell = string | number | boolean | null;

function cleanSheetName(name: string) {
  return name.trim().replace(/[\\/:*?"<>|]+/g, "-").slice(0, 80) || "Planilha";
}

function valueFromCell(cell: ExcelJS.Cell): ImportedCell {
  const value = cell.value;
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "object") {
    if ("result" in value) {
      const result = value.result;
      if (result instanceof Date) return result.toISOString().slice(0, 10);
      if (typeof result === "string" || typeof result === "number" || typeof result === "boolean") {
        return result;
      }
    }

    if ("text" in value && typeof value.text === "string") return value.text;
    if ("hyperlink" in value && typeof value.hyperlink === "string") return value.hyperlink;
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text ?? "").join("");
    }
  }

  return String(value);
}

function valueIsEmpty(value: ImportedCell) {
  return value === null || value === "";
}

function inferType(values: ImportedCell[]) {
  const filled = values.filter((value) => !valueIsEmpty(value));
  if (!filled.length) return "TEXT";

  if (filled.every((value) => typeof value === "boolean")) return "CHECK";
  if (filled.every((value) => typeof value === "number")) return "NUMBER";
  if (
    filled.every(
      (value) =>
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(new Date(`${value}T12:00:00`).getTime()),
    )
  ) {
    return "DATE";
  }

  return "TEXT";
}

function uniqueHeader(baseName: string, used: Map<string, number>) {
  const name = baseName.trim() || "Coluna";
  const count = used.get(name) ?? 0;
  used.set(name, count + 1);
  return count ? `${name} ${count + 1}` : name;
}

async function importWorksheet(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string,
  worksheet: ExcelJS.Worksheet,
  fileStem: string,
  multiSheet: boolean,
) {
  const rows: ImportedCell[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const values: ImportedCell[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      values[colNumber - 1] = valueFromCell(cell);
    });
    if (values.some((value) => !valueIsEmpty(value))) rows.push(values);
  });

  if (!rows.length) return null;

  const headerRow = rows[0];
  const dataRows = rows.slice(1);
  const maxColumnCount = Math.max(
    headerRow.length,
    ...dataRows.map((row) => row.length),
  );

  const columnIndexes = Array.from({ length: maxColumnCount }, (_, index) => index).filter(
    (index) =>
      !valueIsEmpty(headerRow[index] ?? null) ||
      dataRows.some((row) => !valueIsEmpty(row[index] ?? null)),
  );

  if (!columnIndexes.length) return null;

  const usedHeaders = new Map<string, number>();
  const importedColumns = columnIndexes.map((index, position) => {
    const header = headerRow[index];
    const fallback = `Coluna ${position + 1}`;
    const name = uniqueHeader(valueIsEmpty(header) ? fallback : String(header), usedHeaders);
    const samples = dataRows.map((row) => row[index] ?? null);
    return {
      sourceIndex: index,
      name,
      type: inferType(samples),
      width: Math.max(140, Math.min(340, name.length * 11 + 80)),
    };
  });

  const plan = await tx.plan.create({
    data: {
      userId,
      title: multiSheet ? `${fileStem} - ${cleanSheetName(worksheet.name)}` : fileStem,
      description: `Importado de Excel, aba "${worksheet.name}".`,
    },
  });

  const createdColumns: Array<{ id: string }> = [];
  for (const [position, column] of importedColumns.entries()) {
    createdColumns.push(
      await tx.planColumn.create({
        data: {
          planId: plan.id,
          name: column.name,
          type: column.type,
          width: column.width,
          position,
        },
      }),
    );
  }

  const nonEmptyDataRows = dataRows.filter((row) =>
    importedColumns.some((column) => !valueIsEmpty(row[column.sourceIndex] ?? null)),
  );

  const rowsToCreate = nonEmptyDataRows.length ? nonEmptyDataRows : [[]];
  for (const [position, row] of rowsToCreate.entries()) {
    const values = Object.fromEntries(
      importedColumns
        .map((column, index) => [createdColumns[index].id, row[column.sourceIndex] ?? null])
        .filter(([, value]) => !valueIsEmpty(value as ImportedCell)),
    );

    await tx.planRow.create({
      data: {
        planId: plan.id,
        position,
        values,
      },
    });
  }

  return tx.plan.findUnique({
    where: { id: plan.id },
    include: {
      columns: { orderBy: { position: "asc" } },
      rows: { orderBy: { position: "asc" } },
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Envie um arquivo .xlsx" }, { status: 400 });
  }

  const fileName = file.name || "Plano.xlsx";
  if (!fileName.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json({ error: "Por enquanto, importe arquivos .xlsx" }, { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  const buffer = Buffer.from(await file.arrayBuffer());
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

  const usableSheets = workbook.worksheets.filter((sheet) => sheet.actualRowCount > 0);
  if (!usableSheets.length) {
    return NextResponse.json({ error: "Nenhuma aba com dados foi encontrada" }, { status: 400 });
  }

  const fileStem = cleanSheetName(fileName.replace(/\.xlsx$/i, ""));
  const importedPlans = await prisma.$transaction(async (tx) => {
    const created = [];
    for (const worksheet of usableSheets) {
      const plan = await importWorksheet(
        tx,
        session.user.id,
        worksheet,
        fileStem,
        usableSheets.length > 1,
      );
      if (plan) created.push(plan);
    }
    return created;
  });

  if (!importedPlans.length) {
    return NextResponse.json({ error: "Não consegui encontrar uma tabela importável" }, { status: 400 });
  }

  return NextResponse.json({ plans: importedPlans });
}
