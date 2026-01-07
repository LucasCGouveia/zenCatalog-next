// modulos/biblioteca/components/EditTitleModal.tsx
"use client";

import React, { useState, useEffect } from 'react';

interface EditTitleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  currentName: string;
  isSaving: boolean;
}

export const EditTitleModal = ({ isOpen, onClose, onConfirm, currentName, isSaving }: EditTitleModalProps) => {
  const [name, setName] = useState(currentName);

  // Atualiza o estado interno quando o modal abre com um novo nome
  useEffect(() => {
    setName(currentName);
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Renomear Vídeo</h3>
        <p className="text-sm text-slate-500 mb-4">Atualize o título do arquivo no seu acervo.</p>
        
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 border border-slate-200 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
          placeholder="Digite o novo nome..."
          autoFocus
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors font-medium text-sm"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(name)}
            disabled={isSaving || !name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-lg shadow-blue-600/20"
          >
            {isSaving ? 'A guardar...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};