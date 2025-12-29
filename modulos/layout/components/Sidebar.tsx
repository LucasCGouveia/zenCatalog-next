"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlusCircle, MessageSquare, Library, Settings, Video } from 'lucide-react';

export const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Chat Zen', href: '/', icon: <MessageSquare size={18} /> },
    { name: 'Minha Biblioteca', href: '/biblioteca', icon: <Library size={18} /> },
    { name: 'Configurações', href: '/configuracoes', icon: <Settings size={18} /> },
  ];

  return (
    <aside className="w-72 bg-blue-950 border-r border-white/10 flex flex-col h-screen sticky top-0">      {/* Logo Section */}
      <div className="p-8">
        <h1 className="text-2xl font-black tracking-tighter text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/40">
            <Video size={18} className="text-white" />
          </div>
          zen<span className="text-blue-500">Catalog</span>
        </h1>
      </div>

      {/* Primary Action */}
      <div className="px-6 mb-8">
        <Link href="/catalogo">
          <button className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 py-3 rounded-xl font-bold transition-all duration-300 shadow-xl shadow-white/5">
            <PlusCircle size={18} />
            Novo Arquivo
          </button>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 space-y-1">
        <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Menu Principal</p>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-blue-600/10 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}>
                <span className={isActive ? 'text-blue-400' : 'group-hover:text-white transition-colors'}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.name}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.6)]" />}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};