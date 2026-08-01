import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fileName(title: string) {
  return `${title || "plano"}`.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 80);
}

function cellValue(type: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  if (type === "NUMBER") {
    const number = typeof value === "number" ? value : Number(String(value).replace(",", "."));
    return Number.isFinite(number) ? number : value;
  }
  if (type === "DATE" && typeof value === "string") {
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? value : date;
  }
  if (type === "CHECK") return Boolean(value) ? "Sim" : "Não";
  return value;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const plan = await prisma.plan.findFirst({
    where: { id, userId: session.user.id },
    include: {
      columns: { orderBy: { position: "asc" } },
      rows: { orderBy: { position: "asc" } },
    },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ZenCatalog";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Plano", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = plan.columns.map((column) => ({
    header: column.name,
    key: column.id,
    width: Math.max(12, Math.min(Math.round(column.width / 9), 45)),
  }));

  for (const row of plan.rows) {
    const values = row.values as Record<string, unknown>;
    sheet.addRow(
      Object.fromEntries(
        plan.columns.map((column) => [
          column.id,
          cellValue(column.type, values?.[column.id]),
        ]),
      ),
    );
  }

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" },
  };
  header.alignment = { vertical: "middle" };
  header.height = 22;

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, plan.rows.length + 1), column: Math.max(1, plan.columns.length) },
  };

  sheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      if (rowNumber > 1) cell.alignment = { vertical: "top", wrapText: true };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName(plan.title)}.xlsx"`,
    },
  });
}
