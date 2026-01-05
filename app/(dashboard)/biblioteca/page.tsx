import React from 'react';
import { CatalogService } from '@/modulos/catalogo/services/catalogService';
import { LibraryTable } from '@/modulos/biblioteca/components/LibraryTable';
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from 'next/navigation';

export default async function BibliotecaPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const items = await CatalogService.listAll(session.user.id);

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Acervo Digital</h1>
          <p className="text-slate-400 mt-2 italic">“A paz começa em nós quando organizamos o conhecimento.”</p>
        </div>
        <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-sm">
          <span className="text-blue-400 font-bold text-2xl">{items.length}</span>
          <span className="text-slate-400 ml-2 text-sm uppercase font-bold tracking-widest">Itens Salvos</span>
        </div>
      </header>

      <LibraryTable initialItems={JSON.parse(JSON.stringify(items))} />
    </div>
  );
}