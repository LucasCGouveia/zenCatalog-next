// modulos/biblioteca/components/CatalogModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { X, FileText, MessageCircle, Save, Loader2, Clock } from 'lucide-react';
import { updateCatalogAction } from '@/modulos/catalogo/actions/catalogActions';

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onUpdate: (updatedItem: any) => void;
}

export const CatalogModal = ({ isOpen, onClose, item, onUpdate }: CatalogModalProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({ 
    summary: '', 
    observations: '' 
  });

  // Sincroniza o estado interno quando o item muda ou o modal abre
  useEffect(() => {
    if (item) {
      setEditData({
        summary: item.summary || '',
        observations: item.observations || '' // Campo observations vindo do Schema
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header do Modal */}
        <div className="bg-blue-950 p-8 text-white flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
              {item.category} • Editar Detalhes
            </span>
            <h2 className="text-2xl font-black leading-tight pr-8">{item.fileName}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Formulário de Edição */}
        <div className="p-8 space-y-6">
          <div className="flex gap-8 text-sm border-b border-slate-100 pb-6">
             <div>
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

          {/* Campo: Observações do Usuário */}
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

          {/* Botão Salvar */}
          <button 
            onClick={handleSave}
            disabled={isSaving}
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