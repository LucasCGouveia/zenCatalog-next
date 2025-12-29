"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User, Bell, Search } from "lucide-react";

export const Header = () => {
  // Pegamos os dados da sessão (nome, email, imagem)
  const { data: session } = useSession();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-900/50 px-8 backdrop-blur-md">
      {/* Lado Esquerdo: Breadcrumb ou Título */}
      <div>
        <h2 className="text-sm font-medium text-gray-400">
          Principal / <span className="text-gray-100">Dashboard</span>
        </h2>
      </div>

      {/* Lado Direito: Busca, Usuário e Sair */}
      <div className="flex items-center gap-6">
        {/* Barra de Busca Simples */}
        <div className="hidden md:flex items-center gap-2 bg-gray-800/50 border border-gray-700 px-3 py-1.5 rounded-lg text-gray-400">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Buscar na biblioteca..." 
            className="bg-transparent border-none outline-none text-xs w-40"
          />
        </div>

        <button className="text-gray-400 hover:text-white transition">
          <Bell size={20} />
        </button>

        {/* Perfil e Logout */}
        <div className="flex items-center gap-4 border-l border-gray-800 pl-6">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-white">
              {session?.user?.name || "Usuário"}
            </span>
            <span className="text-[10px] text-gray-500 truncate max-w-[120px]">
              {session?.user?.email}
            </span>
          </div>

          <div className="h-9 w-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <User size={20} />
          </div>

          {/* Botão de Logoff Funcional */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors group"
            title="Sair do Sistema"
          >
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
};