"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { 
  LogOut, 
  User, 
  Bell, 
  Search, 
  Settings, 
  Key, 
  ChevronDown 
} from "lucide-react";
import Link from "next/link";

export const Header = () => {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="flex h-20 items-center justify-between border-b border-white/5 bg-blue-950/50 px-8 backdrop-blur-xl sticky top-0 z-40">
      
      {/* Search Bar - Estilo Command Palette */}
      <div className="flex-1 max-w-md hidden md:flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl text-gray-500 focus-within:border-blue-500/50 focus-within:bg-white/10 transition-all group">
        <Search size={18} className="group-focus-within:text-blue-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Pesquisar na biblioteca..." 
          className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-gray-500"
        />
      </div>

      {/* Ações e Perfil */}
      <div className="flex items-center gap-6">
        <button className="relative text-gray-400 hover:text-white transition p-2 hover:bg-white/5 rounded-xl">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-gray-950" />
        </button>

        {/* Menu de Perfil com Dropdown */}
        <div className="relative flex items-center gap-4 pl-6 border-l border-white/10">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-4 hover:bg-white/5 p-1.5 rounded-2xl transition-all group"
          >
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-white leading-none">
                {session?.user?.name || "Usuário"}
              </span>
              <span className="text-[11px] text-blue-400 font-semibold mt-1 tracking-wide uppercase">
                Admin Status
              </span>
            </div>

            {/* Avatar - Agora com suporte à imagem do Google */}
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/20 overflow-hidden">
              {session?.user?.image ? (
                <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={20} />
              )}
            </div>
            
            <ChevronDown 
              size={14} 
              className={`text-gray-500 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {/* Menu Dropdown Card */}
          {isMenuOpen && (
            <>
              {/* Overlay para fechar o menu ao clicar fora */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsMenuOpen(false)}
              ></div>
              
              <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-3xl shadow-2xl z-20 py-3 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-5 py-2 border-b border-slate-50 mb-2">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Opções</p>
                </div>
                
                <Link 
                  href="/perfil" 
                  className="flex items-center gap-3 px-5 py-3 text-slate-600 hover:bg-slate-50 transition-colors font-bold text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={18} className="text-slate-400" /> Meu Perfil
                </Link>
                
                <Link 
                  href="/configuracoes" 
                  className="flex items-center gap-3 px-5 py-3 text-slate-600 hover:bg-slate-50 transition-colors font-bold text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings size={18} className="text-slate-400" /> Configurações
                </Link>

                <Link 
                  href="/trocar-senha" 
                  className="flex items-center gap-3 px-5 py-3 text-slate-600 hover:bg-slate-50 transition-colors font-bold text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Key size={18} className="text-slate-400" /> Trocar Senha
                </Link>

                <div className="border-t border-slate-50 mt-2 pt-2">
                  <button 
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 px-5 py-3 text-red-500 hover:bg-red-50 transition-colors font-black text-sm"
                  >
                    <LogOut size={18} /> Sair do ZenCatalog
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};