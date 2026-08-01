"use server";

import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const defaultColumns = [
  { name: "Item", type: "TEXT", width: 220 },
  { name: "Categoria", type: "TEXT", width: 170 },
  { name: "Status", type: "TEXT", width: 150 },
  { name: "Observações", type: "TEXT", width: 260 },
];

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");
  return session.user.id;
}

async function getOwnedPlan(userId: string, planId: string) {
  const plan = await prisma.plan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw new Error("Plano não encontrado");
  return plan;
}

function normalizeTitle(title: string) {
  const value = title.trim();
  if (!value) throw new Error("Dê um nome para o plano");
  return value.slice(0, 80);
}

function normalizeColumnType(type: string) {
  return ["TEXT", "NUMBER", "DATE", "CHECK"].includes(type) ? type : "TEXT";
}

function normalizeValue(type: string, value: string) {
  if (type === "NUMBER") {
    const normalized = value.replace(",", ".").trim();
    if (!normalized) return "";
    const number = Number(normalized);
    return Number.isFinite(number) ? number : value;
  }

  if (type === "CHECK") return value === "true";
  return value;
}

export async function getPlansData() {
  const userId = await getUserId();

  const count = await prisma.plan.count({ where: { userId } });
  if (!count) {
    await prisma.plan.create({
      data: {
        userId,
        title: "Meu primeiro plano",
        description: "Use colunas, linhas e filtros para organizar qualquer coisa.",
        columns: {
          create: defaultColumns.map((column, position) => ({ ...column, position })),
        },
        rows: { create: [{ position: 0, values: {} }] },
      },
    });
  }

  const plans = await prisma.plan.findMany({
    where: { userId },
    include: {
      columns: { orderBy: { position: "asc" } },
      rows: { orderBy: { position: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return { plans };
}

export async function createPlan(input: { title: string; description?: string }) {
  const userId = await getUserId();
  const plan = await prisma.plan.create({
    data: {
      userId,
      title: normalizeTitle(input.title),
      description: input.description?.trim() || null,
      columns: {
        create: defaultColumns.map((column, position) => ({ ...column, position })),
      },
      rows: { create: [{ position: 0, values: {} }] },
    },
    include: {
      columns: { orderBy: { position: "asc" } },
      rows: { orderBy: { position: "asc" } },
    },
  });

  revalidatePath("/planos");
  return plan;
}

export async function updatePlanMeta(
  planId: string,
  input: { title: string; description?: string },
) {
  const userId = await getUserId();
  await getOwnedPlan(userId, planId);

  const plan = await prisma.plan.update({
    where: { id: planId },
    data: {
      title: normalizeTitle(input.title),
      description: input.description?.trim() || null,
    },
  });

  revalidatePath("/planos");
  return plan;
}

export async function deletePlan(planId: string) {
  const userId = await getUserId();
  await getOwnedPlan(userId, planId);
  await prisma.plan.delete({ where: { id: planId } });
  revalidatePath("/planos");
}

export async function createPlanColumn(planId: string, input: { name: string; type: string }) {
  const userId = await getUserId();
  await getOwnedPlan(userId, planId);

  const max = await prisma.planColumn.aggregate({
    where: { planId },
    _max: { position: true },
  });

  const column = await prisma.planColumn.create({
    data: {
      planId,
      name: input.name.trim() || "Nova coluna",
      type: normalizeColumnType(input.type),
      position: (max._max.position ?? -1) + 1,
    },
  });

  revalidatePath("/planos");
  return column;
}

export async function updatePlanColumn(
  columnId: string,
  input: { name: string; type: string; width?: number },
) {
  const userId = await getUserId();
  const column = await prisma.planColumn.findFirst({
    where: { id: columnId, plan: { userId } },
  });
  if (!column) throw new Error("Coluna não encontrada");

  const updated = await prisma.planColumn.update({
    where: { id: columnId },
    data: {
      name: input.name.trim() || "Coluna",
      type: normalizeColumnType(input.type),
      width: Math.max(120, Math.min(input.width ?? column.width, 420)),
    },
  });

  revalidatePath("/planos");
  return updated;
}

export async function deletePlanColumn(columnId: string) {
  const userId = await getUserId();
  const column = await prisma.planColumn.findFirst({
    where: { id: columnId, plan: { userId } },
  });
  if (!column) throw new Error("Coluna não encontrada");

  await prisma.$transaction(async (tx) => {
    const rows = await tx.planRow.findMany({ where: { planId: column.planId } });
    for (const row of rows) {
      const values = { ...((row.values as Prisma.JsonObject) ?? {}) };
      delete values[columnId];
      await tx.planRow.update({ where: { id: row.id }, data: { values } });
    }
    await tx.planColumn.delete({ where: { id: columnId } });
  });

  revalidatePath("/planos");
}

export async function createPlanRow(planId: string) {
  const userId = await getUserId();
  await getOwnedPlan(userId, planId);

  const max = await prisma.planRow.aggregate({
    where: { planId },
    _max: { position: true },
  });

  const row = await prisma.planRow.create({
    data: {
      planId,
      position: (max._max.position ?? -1) + 1,
      values: {},
    },
  });

  revalidatePath("/planos");
  return row;
}

export async function updatePlanCell(rowId: string, columnId: string, value: string) {
  const userId = await getUserId();
  const [row, column] = await Promise.all([
    prisma.planRow.findFirst({ where: { id: rowId, plan: { userId } } }),
    prisma.planColumn.findFirst({ where: { id: columnId, plan: { userId } } }),
  ]);

  if (!row || !column || row.planId !== column.planId) {
    throw new Error("Célula inválida");
  }

  const values = { ...((row.values as Prisma.JsonObject) ?? {}) };
  values[columnId] = normalizeValue(column.type, value) as Prisma.JsonValue;

  const updated = await prisma.planRow.update({
    where: { id: rowId },
    data: { values },
  });

  revalidatePath("/planos");
  return updated;
}

export async function deletePlanRow(rowId: string) {
  const userId = await getUserId();
  const row = await prisma.planRow.findFirst({ where: { id: rowId, plan: { userId } } });
  if (!row) throw new Error("Linha não encontrada");
  await prisma.planRow.delete({ where: { id: rowId } });
  revalidatePath("/planos");
}
