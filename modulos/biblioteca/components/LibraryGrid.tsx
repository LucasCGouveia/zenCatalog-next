"use client";

import React, { useState } from 'react';
import { Trash2, Clock, User, Tag, FileText } from 'lucide-react';
import { deleteCatalogAction } from '@/modulos/catalogo/actions/catalogActions';

export const LibraryGrid = ({ initialItems }: { initialItems: any[] }) => {
  const [items, setItems] = useState(initialItems);

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      await deleteCatalogAction(id); //
      setItems(items.filter(item => item.id !== id));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <div key={item.id} className="bg-white rounded-[2rem] p-6 shadow-xl hover:shadow-2xl transition-all border border-slate-200 group relative">
          {/* Badge de Categoria */}
          <div className="absolute top-6 right-6 bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            {item.category}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 leading-tight pr-12 line-clamp-2">
              {item.fileName}
            </h3>

            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-blue-500" />
                {item.duration || "N/A"}
              </div>
              <div className="flex items-center gap-1.5">
                <User size={14} className="text-blue-500" />
                {item.author || "Desconhecido"}
              </div>
              <div className="flex items-center gap-1.5">
                <Tag size={14} className="text-blue-500" />
                {item.subcategory}
              </div>
            </div>

            <p className="text-sm text-slate-600 line-clamp-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {item.summary}
            </p>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(item.createdAt).toLocaleDateString('pt-BR')}
              </span>
              
              <button 
                onClick={() => handleDelete(item.id)}
                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                title="Excluir"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};