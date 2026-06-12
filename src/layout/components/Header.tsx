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
  ChevronDown,
  Video
} from "lucide-react";
import Link from "next/link";

export const Header = () => {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    await signOut({ redirect: false });
    window.location.assign("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-blue-950/90 px-3 backdrop-blur-xl sm:px-5 md:h-20 md:px-8">
      <Link href="/" className="flex items-center gap-2 font-black tracking-tight text-white md:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
          <Video size={17} />
        </span>
        <span>zen<span className="text-blue-500">Catalog</span></span>
      </Link>
      
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
      <div className="flex items-center gap-1.5 sm:gap-3 md:gap-6">
        <button className="relative hidden rounded-xl p-2 text-gray-400 transition hover:bg-white/5 hover:text-white sm:block">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-gray-950" />
        </button>

        {/* Menu de Perfil com Dropdown */}
        <div className="relative flex items-center gap-2 border-white/10 sm:border-l sm:pl-3 md:gap-4 md:pl-6">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-4 hover:bg-white/5 p-1.5 rounded-2xl transition-all group"
          >
            <div className="hidden flex-col items-end sm:flex">
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
              className={`hidden text-gray-500 transition-transform duration-300 sm:block ${isMenuOpen ? 'rotate-180' : ''}`}
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
                    onClick={handleSignOut}
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
