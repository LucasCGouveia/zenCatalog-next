
import React from 'react';
import { CatalogItem } from '../types';

interface HistoryListProps {
  items: CatalogItem[];
  onDelete: (id: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ items, onDelete }) => {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
        <i className="fa-solid fa-box-open text-gray-300 text-4xl mb-4"></i>
        <p className="text-gray-500">Nenhum vídeo catalogado ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <i className="fa-solid fa-list-ul text-indigo-500"></i>
        Histórico de Catalogação
      </h3>
      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    item.category === '[ESP]' ? 'bg-amber-100 text-amber-700' :
                    item.category === '[FILO]' ? 'bg-blue-100 text-blue-700' :
                    item.category === '[HIST]' ? 'bg-green-100 text-green-700' :
                    item.category === '[DICA]' ? 'bg-purple-100 text-purple-700' :
                    'bg-pink-100 text-pink-700'
                  }`}>
                    {item.category.replace('[', '').replace(']', '')}
                  </span>
                  {item.isWatchEveryDay && (
                    <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                      <i className="fa-solid fa-star text-[8px]"></i> Diário
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-gray-900 truncate flex items-center gap-2">
                  {item.suggestedFilename}
                  <button 
                    onClick={() => navigator.clipboard.writeText(item.suggestedFilename)}
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Copiar Nome"
                  >
                    <i className="fa-regular fa-copy text-xs"></i>
                  </button>
                </h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.summary}</p>
              </div>
              <button 
                onClick={() => onDelete(item.id)}
                className="text-gray-400 hover:text-red-600 p-2 md:opacity-0 group-hover:opacity-100 transition-all"
              >
                <i className="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
