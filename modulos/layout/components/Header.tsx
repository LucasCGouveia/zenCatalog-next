"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User, Bell, Search } from "lucide-react";

export const Header = () => {
  const { data: session } = useSession();

  return (
    <header className="flex h-20 items-center justify-between border-b border-white/5 bg-blue-950/50 px-8 backdrop-blur-xl sticky top-0 z-40">
      {/* Search Bar - Estilo Command Palette */}
      <div className="flex-1 max-w-md hidden md:flex items-center gap-3 bg-white/[0.80] border border-white/10 px-4 py-2.5 rounded-2xl text-gray-500 focus-within:border-blue-500/50 focus-within:bg-white/[0.05] transition-all group">
        <Search size={18} className="group-focus-within:text-blue-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Pesquisar na biblioteca..." 
          className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-gray-600"
        />
      </div>

      {/* Ações e Perfil */}
      <div className="flex items-center gap-6">
        <button className="relative text-gray-400 hover:text-white transition p-2 hover:bg-white/5 rounded-xl">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-gray-950" />
        </button>

        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-white leading-none">
              {session?.user?.name || "Usuário"}
            </span>
            <span className="text-[11px] text-blue-400 font-semibold mt-1 tracking-wide uppercase">
              Admin Status
            </span>
          </div>

          {/* Avatar com Gradiente */}
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
            <User size={20} />
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400 rounded-2xl transition-all group"
            title="Sair"
          >
            <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
};