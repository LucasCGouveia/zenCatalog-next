"use client";

import React, { useState, useEffect } from 'react';
import { Save, Sparkles, RefreshCw } from 'lucide-react';
import { getUserPrompt, updateSystemPrompt } from '@/modulos/layout/actions/configActions';
import { useSession } from 'next-auth/react';

export default function ConfiguracoesPage() {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (session?.user?.id) {
        // Buscamos o prompt que está no MongoDB
        const result = await getUserPrompt(session.user.id);
        if (result.success) {
          setPrompt(result.prompt || "");
        }
        setIsLoading(false);
      }
    }
    loadData();
  }, [session]);

  const handleSave = async () => {
    console.log("ID do usuário:", session?.user?.id); // Verifique se aparece no console do navegador
    if (!session?.user?.id) return;
    setIsSaving(true);

    const result = await updateSystemPrompt(session.user.id, prompt);

    if (result.success) {
      alert("Configurações salvas no MongoDB!");
    } else {
      alert("Erro ao salvar: " + result.error);
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="p-10 text-white">Carregando configurações...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-black text-white">Configurações</h1>
        <p className="text-slate-400">Personalize o comportamento da sua Inteligência Artificial.</p>
      </header>

      <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-200">
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-blue-600 font-bold uppercase tracking-widest text-xs">
            <Sparkles size={16} />
            Prompt do Sistema (Análise de Vídeos)
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-64 bg-slate-50 border border-slate-200 rounded-3xl p-8 text-slate-800 text-lg leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Digite aqui as instruções para a IA..."
          />

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all"
          >
            {isSaving ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}

function setIsLoading(arg0: boolean) {
  throw new Error('Function not implemented.');
}