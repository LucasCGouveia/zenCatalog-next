"use client";

import React, { useState, useMemo } from 'react';
import { Trash2, Clock, Search, Filter, Info, Pencil, Youtube } from 'lucide-react'; // Adicionado Youtube
import { deleteCatalogAction, updateCatalogAction } from '@/src/catalogo/actions/catalogActions';
import { Category } from '@/src/catalogo/types';
import { CatalogModal } from './CatalogModal';
import { EditTitleModal } from './EditiTitleModal';

interface LibraryTableProps {
  initialItems: any[];
}

export const LibraryTable = ({ initialItems }: LibraryTableProps) => {
  const [items, setItems] = useState(initialItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<any>(null);

  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSavingName, setIsSavingName] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.author?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.subject?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  const openModal = (item: any) => {
    setActiveItem(item);
    setIsModalOpen(true);
  };

  const handleUpdateItem = (updatedItem: any) => {
    setItems(items.map(it => it.id === updatedItem.id ? updatedItem : it));
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja remover este registro do acervo permanentemente?")) {
      await deleteCatalogAction(id);
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleRename = async (newName: string) => {
    if (!editingItem) return;
    try {
      setIsSavingName(true);
      const result = await updateCatalogAction(editingItem.id, { fileName: newName });
      if (result.success) {
        setItems(items.map(item => 
          item.id === editingItem.id ? { ...item, fileName: newName } : item
        ));
        setEditingItem(null);
      } else {
        alert("Erro ao renomear o arquivo.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar alterações.");
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ferramentas */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar por título, autor ou assunto..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter size={18} className="text-slate-400 hidden md:block" />
          <select 
            className="w-full md:w-48 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 font-bold text-sm outline-none cursor-pointer"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">Todas Categorias</option>
            {Object.values(Category).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-6 text-xs font-black uppercase tracking-widest">Categoria</th>
                <th className="p-6 text-xs font-black uppercase tracking-widest">Título / Arquivo</th>
                <th className="p-6 text-xs font-black uppercase tracking-widest">Autor</th>
                <th className="p-6 text-xs font-black uppercase tracking-widest">Duração</th>
                <th className="p-6 text-xs font-black uppercase tracking-widest text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="p-6">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col text-left group/title">
                      <div className="flex items-center gap-2">
                        {/* Se tiver URL, mostra ícone do YouTube Clicável */}
                        {item.videoUrl && (
                          <a 
                            href={item.videoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-red-500 hover:text-red-600 hover:scale-110 transition-transform"
                            title="Assistir no YouTube"
                            onClick={(e) => e.stopPropagation()} // Evita abrir o modal ao clicar no link
                          >
                            <Youtube size={20} />
                          </a>
                        )}
                        
                        <button onClick={() => openModal(item)} className="text-slate-900 font-bold line-clamp-1 hover:text-blue-600 transition-colors text-left">
                          {item.fileName}
                        </button>
                        
                        <button onClick={() => openModal(item)}>
                          <Info size={14} className="opacity-0 group-hover/title:opacity-100 transition-opacity text-blue-400" />
                        </button>
                      </div>
                      <span className="text-slate-400 text-xs line-clamp-1 mt-1">{item.subject || 'Sem assunto'}</span>
                    </div>
                  </td>
                  <td className="p-6 text-sm text-slate-600 font-medium">
                    {item.author || "—"}
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Clock size={14} className="text-blue-500" />
                      {item.duration || "N/A"}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setEditingItem(item)}
                        className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Renomear"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredItems.length === 0 && (
            <div className="p-20 text-center text-slate-400">
              Nenhum item encontrado.
            </div>
          )}
        </div>
      </div>

      <CatalogModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={activeItem}
        onUpdate={handleUpdateItem}
      />

      {editingItem && (
        <EditTitleModal 
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onConfirm={handleRename}
          currentName={editingItem.fileName}
          isSaving={isSavingName}
        />
      )}
    </div>
  );
};