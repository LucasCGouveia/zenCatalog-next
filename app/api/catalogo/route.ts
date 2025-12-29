import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Listar todos os vídeos do banco
export async function GET() {
  try {
    const items = await prisma.catalog.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Apagar um vídeo do banco
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: "ID não enviado" }, { status: 400 });

    await prisma.catalog.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}