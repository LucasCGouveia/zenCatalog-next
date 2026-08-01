"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");
  return session.user.id;
}

async function assertOwnedFolder(folderId: string, userId: string) {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
    select: { id: true },
  });
  if (!folder) throw new Error("Pasta inválida");
  return folder;
}

async function nextNotePosition(folderId: string) {
  const max = await prisma.note.aggregate({
    where: { folderId },
    _max: { position: true },
  });
  return (max._max.position ?? -1) + 1;
}

export async function getFolders() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  return await prisma.folder.findMany({
    where: { userId: session.user.id },
    include: {
      notes: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createFolder(name: string) {
  const userId = await getUserId();

  await prisma.folder.create({
    data: {
      name: name.trim() || "Nova pasta",
      userId,
    },
  });

  revalidatePath("/anotacoes");
}

export async function deleteFolder(id: string) {
  const userId = await getUserId();
  await prisma.folder.deleteMany({ where: { id, userId } });
  revalidatePath("/anotacoes");
}

export async function createNote(folderId: string, title: string, content: string) {
  const userId = await getUserId();
  await assertOwnedFolder(folderId, userId);

  await prisma.note.create({
    data: {
      title,
      content,
      folderId,
      position: await nextNotePosition(folderId),
    },
  });
  revalidatePath("/anotacoes");
}

export async function updateNote(id: string, title: string, content: string) {
  const userId = await getUserId();
  const note = await prisma.note.findFirst({
    where: { id, folder: { userId } },
    select: { id: true },
  });
  if (!note) throw new Error("Nota inválida");

  await prisma.note.update({
    where: { id },
    data: { title, content },
  });
  revalidatePath("/anotacoes");
}

export async function deleteNote(id: string) {
  const userId = await getUserId();
  await prisma.note.deleteMany({ where: { id, folder: { userId } } });
  revalidatePath("/anotacoes");
}

export async function updateNotesOrder(
  folders: Array<{ folderId: string; noteIds: string[] }>,
) {
  const userId = await getUserId();
  const folderIds = folders.map((folder) => folder.folderId);
  const noteIds = folders.flatMap((folder) => folder.noteIds);

  const ownedFolders = await prisma.folder.findMany({
    where: { id: { in: folderIds }, userId },
    select: { id: true },
  });
  if (ownedFolders.length !== new Set(folderIds).size) {
    throw new Error("Pasta inválida");
  }

  const ownedNotes = await prisma.note.findMany({
    where: { id: { in: noteIds }, folder: { userId } },
    select: { id: true },
  });
  if (ownedNotes.length !== new Set(noteIds).size) {
    throw new Error("Nota inválida");
  }

  await prisma.$transaction(
    folders.flatMap((folder) =>
      folder.noteIds.map((noteId, position) =>
        prisma.note.update({
          where: { id: noteId },
          data: {
            folderId: folder.folderId,
            position,
          },
        }),
      ),
    ),
  );

  revalidatePath("/anotacoes");
}
