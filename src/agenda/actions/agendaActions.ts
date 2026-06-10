"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const defaultStatuses = [
  { name: "A Fazer", color: "#F59E0B" },
  { name: "Em Curso", color: "#3B82F6" },
  { name: "Feitas", color: "#10B981" },
];

const defaultLanes = ["Sistemas", "Aulas", "Livros e Violão", "Livre"];

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");
  return session.user.id;
}

async function getOwnedBoard(userId: string) {
  const board = await prisma.agendaBoard.findUnique({ where: { userId } });
  if (!board) throw new Error("Quadro não encontrado");
  return board;
}

async function validateCell(boardId: string, statusId: string, laneId: string) {
  const [status, lane] = await Promise.all([
    prisma.agendaStatus.findFirst({ where: { id: statusId, boardId } }),
    prisma.agendaLane.findFirst({ where: { id: laneId, boardId } }),
  ]);

  if (!status || !lane) throw new Error("Área ou status inválido");
}

async function validateNote(userId: string, noteId?: string | null) {
  if (!noteId) return null;

  const note = await prisma.note.findFirst({
    where: { id: noteId, folder: { userId } },
    select: { id: true },
  });

  if (!note) throw new Error("Anotação inválida");
  return note.id;
}

export async function getAgendaData() {
  const userId = await getUserId();

  let board = await prisma.agendaBoard.findUnique({
    where: { userId },
    include: {
      statuses: { orderBy: { position: "asc" } },
      lanes: { orderBy: { position: "asc" } },
      cards: {
        include: {
          note: { select: { id: true, title: true, folderId: true } },
        },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!board) {
    board = await prisma.agendaBoard.create({
      data: {
        userId,
        statuses: {
          create: defaultStatuses.map((status, position) => ({
            ...status,
            position,
          })),
        },
        lanes: {
          create: defaultLanes.map((name, position) => ({ name, position })),
        },
      },
      include: {
        statuses: { orderBy: { position: "asc" } },
        lanes: { orderBy: { position: "asc" } },
        cards: {
          include: {
            note: { select: { id: true, title: true, folderId: true } },
          },
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        },
      },
    });
  }

  const folders = await prisma.folder.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      notes: {
        select: { id: true, title: true, folderId: true },
        orderBy: { updatedAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return { board, folders };
}

export async function createAgendaCard(input: {
  title: string;
  description?: string;
  color: string;
  dueDate?: string;
  statusId: string;
  laneId: string;
  noteId?: string | null;
}) {
  const userId = await getUserId();
  const board = await getOwnedBoard(userId);
  await validateCell(board.id, input.statusId, input.laneId);
  const noteId = await validateNote(userId, input.noteId);

  const lastCard = await prisma.agendaCard.findFirst({
    where: {
      boardId: board.id,
      statusId: input.statusId,
      laneId: input.laneId,
    },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const card = await prisma.agendaCard.create({
    data: {
      boardId: board.id,
      statusId: input.statusId,
      laneId: input.laneId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      color: input.color,
      dueDate: input.dueDate ? new Date(`${input.dueDate}T12:00:00`) : null,
      noteId,
      position: (lastCard?.position ?? -1) + 1,
    },
    include: {
      note: { select: { id: true, title: true, folderId: true } },
    },
  });

  revalidatePath("/agenda");
  return card;
}

export async function updateAgendaCard(
  id: string,
  input: {
    title: string;
    description?: string;
    color: string;
    dueDate?: string;
    statusId: string;
    laneId: string;
    noteId?: string | null;
  },
) {
  const userId = await getUserId();
  const board = await getOwnedBoard(userId);
  const existing = await prisma.agendaCard.findFirst({
    where: { id, boardId: board.id },
  });
  if (!existing) throw new Error("Post-it não encontrado");

  await validateCell(board.id, input.statusId, input.laneId);
  const noteId = await validateNote(userId, input.noteId);

  const card = await prisma.agendaCard.update({
    where: { id },
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      color: input.color,
      dueDate: input.dueDate ? new Date(`${input.dueDate}T12:00:00`) : null,
      statusId: input.statusId,
      laneId: input.laneId,
      noteId,
    },
    include: {
      note: { select: { id: true, title: true, folderId: true } },
    },
  });

  revalidatePath("/agenda");
  return card;
}

export async function moveAgendaCard(
  id: string,
  statusId: string,
  laneId: string,
) {
  const userId = await getUserId();
  const board = await getOwnedBoard(userId);
  const card = await prisma.agendaCard.findFirst({
    where: { id, boardId: board.id },
  });
  if (!card) throw new Error("Post-it não encontrado");

  await validateCell(board.id, statusId, laneId);

  await prisma.agendaCard.update({
    where: { id },
    data: { statusId, laneId },
  });

  revalidatePath("/agenda");
}

export async function deleteAgendaCard(id: string) {
  const userId = await getUserId();
  const board = await getOwnedBoard(userId);
  const result = await prisma.agendaCard.deleteMany({
    where: { id, boardId: board.id },
  });
  if (!result.count) throw new Error("Post-it não encontrado");
  revalidatePath("/agenda");
}

export async function updateAgendaOrientation(orientation: string) {
  const userId = await getUserId();
  const board = await getOwnedBoard(userId);
  const value =
    orientation === "LANE_COLUMNS" ? "LANE_COLUMNS" : "STATUS_COLUMNS";

  await prisma.agendaBoard.update({
    where: { id: board.id },
    data: { orientation: value },
  });
  revalidatePath("/agenda");
}

export async function updateAgendaAxes(input: {
  boardName: string;
  statuses: Array<{ id?: string; name: string; color: string }>;
  lanes: Array<{ id?: string; name: string }>;
}) {
  const userId = await getUserId();
  const board = await getOwnedBoard(userId);
  const statuses = input.statuses.filter((item) => item.name.trim());
  const lanes = input.lanes.filter((item) => item.name.trim());

  if (!statuses.length || !lanes.length) {
    throw new Error("Mantenha ao menos um status e uma área");
  }

  const currentStatuses = await prisma.agendaStatus.findMany({
    where: { boardId: board.id },
    include: { _count: { select: { cards: true } } },
  });
  const currentLanes = await prisma.agendaLane.findMany({
    where: { boardId: board.id },
    include: { _count: { select: { cards: true } } },
  });

  const keptStatusIds = new Set(statuses.flatMap((item) => (item.id ? [item.id] : [])));
  const keptLaneIds = new Set(lanes.flatMap((item) => (item.id ? [item.id] : [])));
  const blockedStatus = currentStatuses.find(
    (item) => !keptStatusIds.has(item.id) && item._count.cards > 0,
  );
  const blockedLane = currentLanes.find(
    (item) => !keptLaneIds.has(item.id) && item._count.cards > 0,
  );

  if (blockedStatus || blockedLane) {
    throw new Error("Mova os post-its antes de remover esta linha ou coluna");
  }

  await prisma.$transaction(async (tx) => {
    await tx.agendaBoard.update({
      where: { id: board.id },
      data: { name: input.boardName.trim() || "Minha Agenda" },
    });

    await tx.agendaStatus.deleteMany({
      where: {
        boardId: board.id,
        id: { notIn: Array.from(keptStatusIds) },
      },
    });
    await tx.agendaLane.deleteMany({
      where: {
        boardId: board.id,
        id: { notIn: Array.from(keptLaneIds) },
      },
    });

    for (const [position, status] of statuses.entries()) {
      if (status.id) {
        await tx.agendaStatus.update({
          where: { id: status.id },
          data: { name: status.name.trim(), color: status.color },
        });
      } else {
        const max = await tx.agendaStatus.aggregate({
          where: { boardId: board.id },
          _max: { position: true },
        });
        await tx.agendaStatus.create({
          data: {
            boardId: board.id,
            name: status.name.trim(),
            color: status.color,
            position: Math.max(position, (max._max.position ?? -1) + 1),
          },
        });
      }
    }

    for (const [position, lane] of lanes.entries()) {
      if (lane.id) {
        await tx.agendaLane.update({
          where: { id: lane.id },
          data: { name: lane.name.trim() },
        });
      } else {
        const max = await tx.agendaLane.aggregate({
          where: { boardId: board.id },
          _max: { position: true },
        });
        await tx.agendaLane.create({
          data: {
            boardId: board.id,
            name: lane.name.trim(),
            position: Math.max(position, (max._max.position ?? -1) + 1),
          },
        });
      }
    }
  });

  revalidatePath("/agenda");
}
