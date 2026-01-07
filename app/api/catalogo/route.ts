export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Listar todos os vídeos do banco
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }
    const items = await prisma.catalog.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(items);
  } catch (error: unknown) {
    // Tratamento seguro do tipo unknown
    const errorMessage = error instanceof Error ? error.message : "Erro ao buscar catálogo";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, newTitle } = await req.json();

    if (!id || !newTitle) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // --- AQUI VAI SUA LÓGICA DE BANCO DE DADOS ---
    // Exemplo com Prisma:
    // await prisma.catalogItem.update({
    //   where: { id },
    //   data: { title: newTitle } // ou 'description', dependendo do nome do campo
    // });
    
    // Se for array em memória (apenas para teste):
    // items = items.map(item => item.id === id ? { ...item, title: newTitle } : item);

    return NextResponse.json({ success: true, message: "Renomeado com sucesso" });

  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// Apagar um vídeo do banco
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID não enviado" }, { status: 400 });

    const result = await prisma.catalog.deleteMany({
      where: { id, userId: session.user.id }
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Vídeo não encontrado ou não autorizado" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao apagar vídeo";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}