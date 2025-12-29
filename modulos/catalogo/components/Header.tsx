"use client";
import { signOut, useSession } from "next-auth/react";

export const Header = () => { // Mudança para export const
  const { data: session } = useSession();

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <i className="fa-solid fa-clapperboard text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">ZenCatalog</h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Organizador de Acervo Espiritual</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            Powered by Gemini
          </span>
        </div>
      </div>
    </header>
  );
};
}