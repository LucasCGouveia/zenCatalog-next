"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { MessageSquare, PlusCircle } from "lucide-react";

export function Sidebar() {
  const { data: session } = useSession();
  const [videos, setVideos] = useState([]);

  // Busca a lista simplificada para o menu lateral
  useEffect(() => {
    fetch('/api/catalogo')
      .then(res => res.json())
      .then(data => setVideos(data));
  }, []);

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      <div className="p-6 flex flex-col gap-3">
        <h1 className="text-xl font-bold text-blue-500 mb-4">zenCatalog</h1>

        {/* Botão de Ação: Novo Arquivo */}
        <Link href="/catalogo">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
            <PlusCircle size={18} />
            Novo Arquivo
          </button>
        </Link>

        {/* Botão de Navegação: Chat Zen (Voltar para a Home) */}
        <Link href="/">
          <button className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border border-gray-700">
            <MessageSquare size={18} className="text-blue-400" />
            Chat Zen
          </button>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Vídeos Recentes
        </h2>
        <ul className="space-y-2">
          {videos.map((video: any) => (
            <li key={video.id} className="text-gray-400 hover:text-white cursor-pointer truncate text-sm p-2 hover:bg-gray-800 rounded">
              {video.fileName}
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">Logado como:</p>
        <p className="text-sm truncate">{session?.user?.email}</p>
      </div>
    </aside>
  );
}