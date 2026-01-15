"use client";

import React, { useState, useEffect } from 'react';
import { X, FileText, MessageCircle, Save, Loader2, Clock, Pencil, Youtube, ExternalLink } from 'lucide-react'; // Adicionado Youtube e ExternalLink
import { updateCatalogAction } from '@/src/catalogo/actions/catalogActions';

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onUpdate: (updatedItem: any) => void;
}

export const CatalogModal = ({ isOpen, onClose, item, onUpdate }: CatalogModalProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({ 
    fileName: '', 
    summary: '', 
    observations: '' 
  });

  useEffect(() => {
    if (item) {
      setEditData({
        fileName: item.fileName || '',
        summary: item.summary || '',
        observations: item.observations || ''
      });
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateCatalogAction(item.id, editData);
    
    if (result.success) {
      onUpdate({ ...item, ...editData });
      onClose();
    } else {
      alert("Erro ao salvar: " + result.error);
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header do Modal */}
        <div className="bg-blue-950 p-8 text-white flex justify-between items-start shrink-0">
          <div className="space-y-2 w-full mr-8">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
              {item.category} • Editar Detalhes
            </span>
            
            <div className="relative group">
              <input
                type="text"
                value={editData.fileName}
                onChange={(e) => setEditData({ ...editData, fileName: e.target.value })}
                className="w-full bg-transparent text-2xl font-black leading-tight border-b border-white/10 focus:border-blue-400 outline-none pb-1 transition-all placeholder-white/30"
                placeholder="Nome do Vídeo"
              />
              <Pencil size={14} className="absolute right-0 top-2 text-white/30 pointer-events-none" />
            </div>
          </div>

          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white shrink-0">
            <X size={24} />
          </button>
        </div>

        {/* Formulário de Edição */}
        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* Metadados e Link */}
          <div className="flex flex-wrap gap-6 text-sm border-b border-slate-100 pb-6">
             <div className="flex-1 min-w-[120px]">
               <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">Autor</p>
               <p className="text-slate-900 font-bold">{item.author || "N/A"}</p>
             </div>
             <div>
               <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">Duração</p>
               <p className="text-slate-900 font-bold flex items-center gap-2">
                 <Clock size={14} className="text-blue-500" />
                 {item.duration || "N/A"}
               </p>
             </div>

             {/* BOTÃO DO LINK (Se existir) */}
             {item.videoUrl && (
               <div className="flex items-end">
                 <a 
                   href={item.videoUrl}
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                 >
                   <Youtube size={16} />
                   Assistir Vídeo
                   <ExternalLink size={12} className="opacity-50" />
                 </a>
               </div>
             )}
          </div>

          {/* Campo: Resumo da IA */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-blue-600 font-black uppercase text-[11px] tracking-widest">
              <FileText size={16} /> Resumo da IA
            </label>
            <textarea 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 h-32 outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
              value={editData.summary}
              onChange={(e) => setEditData({...editData, summary: e.target.value})}
            />
          </div>

          {/* Campo: Observações */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-blue-600 font-black uppercase text-[11px] tracking-widest">
              <MessageCircle size={16} /> Minhas Observações
            </label>
            <textarea 
              placeholder="Adicione suas notas pessoais aqui..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 h-24 outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
              value={editData.observations}
              onChange={(e) => setEditData({...editData, observations: e.target.value})}
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving || !editData.fileName.trim()}
            className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {isSaving ? "Gravando no Banco..." : "Salvar Alterações"}
          </button>
        </div>
      </div>
    </div>
  );
};