"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Files, PlusCircle, MessageSquare, Library, Settings, Video } from 'lucide-react';
import { BookOpen } from "lucide-react";

export const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Chat Zen', href: '/', icon: <MessageSquare size={18} /> },
    { name: 'Meu Acervo', href: '/acervo', icon: <Library size={18} /> },
    { name: 'Minha Biblioteca', href: '/biblioteca', icon: <Files size={18} /> },
    { name: 'Agenda', href: '/agenda', icon: <CalendarDays size={18} /> },
    { name: 'Anotações', href: '/anotacoes', icon: <BookOpen size={18} /> },
    { name: 'Configurações', href: '/configuracoes', icon: <Settings size={18} /> },
  ];

  return (
    <>
      <aside className="hidden h-dvh w-72 shrink-0 flex-col border-r border-white/10 bg-blue-950 md:flex">
        <div className="p-8">
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tighter text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/40">
              <Video size={18} className="text-white" />
            </div>
            zen<span className="text-blue-500">Catalog</span>
          </h1>
        </div>

        <div className="mb-8 px-6">
          <Link
            href="/catalogo"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-bold text-black shadow-xl shadow-white/5 transition-all duration-300 hover:bg-gray-200"
          >
            <PlusCircle size={18} />
            Novo Arquivo
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          <p className="mb-4 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Menu Principal</p>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
                  isActive ? 'bg-blue-600/10 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={isActive ? 'text-blue-400' : 'transition-colors group-hover:text-white'}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.name}</span>
                {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />}
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-50 flex h-[4.5rem] items-stretch border-t border-white/10 bg-blue-950/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_30px_rgba(2,6,23,0.35)] backdrop-blur-xl md:hidden"
      >
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 text-[9px] font-semibold transition-colors sm:text-[10px] ${
                isActive ? "text-blue-400" : "text-slate-400 active:bg-white/5 active:text-white"
              }`}
            >
              <span className={`rounded-xl p-1.5 ${isActive ? "bg-blue-500/15" : ""}`}>{item.icon}</span>
              <span className="max-w-full truncate">{item.name.replace("Minha ", "").replace("Meu ", "")}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};
