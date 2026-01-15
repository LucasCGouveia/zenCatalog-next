import React from 'react';
import { CatalogItem } from '../types';
import { Trash2, Copy, Star, FileVideo } from 'lucide-react'; 

interface HistoryListProps {
  items: CatalogItem[];
  onDelete: (id: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ items, onDelete }) => {
  if (items.length === 0) {
    return (
      <div className="bg-gray-900/50 rounded-xl border border-dashed border-gray-800 p-12 text-center">
        <p className="text-gray-500">Nenhum vídeo catalogado ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-gray-800/40 p-4 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-all group animate-in slide-in-from-bottom-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    item.category === '[ESP]' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {item.category?.replace('[', '').replace(']', '') || 'GERAL'}
                  </span>
                  {item.isWatchEveryDay && (
                    <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                      <Star size={10} /> Diário
                    </span>
                  )}
                  {/* Data de Upload (Opcional, mas útil) */}
                  <span className="text-[10px] text-gray-500 ml-auto md:ml-0">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : ''}
                  </span>
                </div>

                {/* AQUI ESTÁ A CORREÇÃO DO NOME */}
                <h4 className="text-sm font-bold text-white truncate flex items-center gap-2" title={item.fileName}>
                  <FileVideo size={14} className="text-gray-600 shrink-0" />
                  
                  {/* Tenta mostrar fileName, se não tiver vai para os outros */}
                  {item.fileName || item.suggestedFilename || item.originalName || "Vídeo sem nome"}
                  
                  <button 
                    onClick={() => navigator.clipboard.writeText(item.fileName || "")}
                    className="text-gray-600 hover:text-blue-400 transition-colors"
                    title="Copiar nome"
                  >
                    <Copy size={12} />
                  </button>
                </h4>
                
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                  {item.summary || "Sem resumo disponível."}
                </p>
              </div>

              <button 
                onClick={() => onDelete(item.id)}
                className="text-gray-600 hover:text-red-500 p-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all"
                title="Excluir do catálogo"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};