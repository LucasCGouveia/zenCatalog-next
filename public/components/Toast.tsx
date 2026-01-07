"use client";

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Pequeno delay para a animação de entrada funcionar
    const timerIn = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timerIn);
  }, []);

  useEffect(() => {
    // Fecha sozinho após 4 segundos
    const timerOut = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 4000);
    return () => clearTimeout(timerOut);
  }, [onClose]);

  return (
    <div 
      className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border transition-all duration-300 transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      } ${
        type === 'success' 
          ? 'bg-green-900/90 border-green-500/30 text-green-100 shadow-green-900/20' 
          : 'bg-red-900/90 border-red-500/30 text-red-100 shadow-red-900/20'
      }`}
    >
      <div className={`p-2 rounded-full ${type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
        {type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
      </div>
      
      <div className="flex flex-col">
        <span className="font-bold text-sm text-white">
          {type === 'success' ? 'Sucesso' : 'Erro'}
        </span>
        <span className="text-xs opacity-90 font-medium text-white/80">{message}</span>
      </div>

      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="ml-4 hover:text-white transition-colors">
        <X size={14} />
      </button>
    </div>
  );
};