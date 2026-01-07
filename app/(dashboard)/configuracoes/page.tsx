"use client";

import React, { useState, useEffect } from 'react';
import { Save, Sparkles, MessageSquare, HardDrive, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getUserPrompts, updatePromptsAction } from '@/modulos/layout/actions/configActions';
import { useSession } from 'next-auth/react';
import { Toast } from '@/public/components/Toast';

export default function ConfiguracoesPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("videos");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [chatPrompt, setChatPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // <--- 2. Estado para controlar a notificação
  const [toast, setToast] = useState<{ show: boolean, msg: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function loadData() {
      if (session?.user?.id) {
        const result = await getUserPrompts(session.user.id);
        if (result.success && result.prompts) {
          setSystemPrompt(result.prompts.system);
          setChatPrompt(result.prompts.chat);
        }
        setIsLoading(false);
      }
    }
    loadData();
  }, [session]);

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setIsSaving(true);

    const result = await updatePromptsAction(session.user.id, systemPrompt, chatPrompt);

    // <--- 3. Substituindo Alert por Toast
    if (result.success) {
      setToast({ show: true, msg: "Configurações salvas com sucesso!", type: 'success' });
    } else {
      setToast({ show: true, msg: "Erro ao salvar: " + result.error, type: 'error' });
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="p-10 text-white animate-pulse">Carregando cérebro do ZenCatalog...</div>;

  const tabs = [
    { id: "videos", label: "Prompt Vídeos", icon: Sparkles },
    { id: "chat", label: "Prompt ChatZen", icon: MessageSquare },
    { id: "storage", label: "Armazenamento", icon: HardDrive },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* <--- 4. Renderizando o Toast no topo da tela */}
      {toast?.show && (
        <Toast 
          message={toast.msg} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <header>
        <h1 className="text-4xl font-black text-white tracking-tight">Configurações</h1>
        <p className="text-blue-300/50 font-bold uppercase tracking-widest text-xs mt-2">Ajuste os parâmetros da sua experiência</p>
      </header>

      {/* Navegação por Abas (O seu "Broadcamp") */}
      <div className="flex bg-blue-950/40 p-1.5 rounded-[2rem] border border-white/5 self-start w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-8 py-3.5 rounded-[1.5rem] font-bold text-sm transition-all ${
              activeTab === tab.id 
                ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 min-h-[500px] flex flex-col">
        
        {/* CONTEÚDO: PROMPT VÍDEOS */}
        {activeTab === "videos" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-black text-slate-800">Cérebro de Organização</h2>
              <p className="text-slate-500">Como a IA deve catalogar seus vídeos e sugerir nomenclaturas.</p>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full h-80 bg-slate-50 border border-slate-200 rounded-3xl p-8 text-slate-800 text-lg leading-relaxed focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-mono"
              placeholder="Instruções para análise técnica..."
            />
          </div>
        )}

        {/* CONTEÚDO: PROMPT CHATZEN */}
        {activeTab === "chat" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-black text-slate-800">Personalidade do ChatZen</h2>
              <p className="text-slate-500">Defina o tom de voz e a profundidade filosófica do seu mentor.</p>
            </div>
            <textarea
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              className="w-full h-80 bg-slate-50 border border-slate-200 rounded-3xl p-8 text-slate-800 text-lg leading-relaxed focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-mono"
              placeholder="Instruções para o chat espiritual..."
            />
          </div>
        )}

        {/* CONTEÚDO: ARMAZENAMENTO */}
        {activeTab === "storage" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-black text-slate-800">Google Drive</h2>
              <p className="text-slate-500">Status da conexão para salvamento automático de vídeos.</p>
            </div>
            
            <div className="flex items-center gap-6 p-8 bg-blue-50 border border-blue-100 rounded-[2rem]">
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                {/* Adicione esta linha logo acima da tag img */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://authjs.dev/img/providers/google.svg" className="w-10" alt="Google" />
              </div>
              <div className="flex-1">
                <p className="text-slate-900 font-black text-lg">Google Account vinculada</p>
                <p className="text-blue-600 font-bold flex items-center gap-1.5 mt-1">
                  <CheckCircle2 size={16} /> Drive pronto para receber arquivos
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Espaço do Usuário</p>
                <span className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-black text-sm">
                  Vinculado
                </span>
              </div>
            </div>
          </div>
        )}

        {/* BOTÃO SALVAR (Fixo no rodapé do card) */}
        {activeTab !== "storage" && (
          <div className="mt-auto pt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
              Salvar Alterações
            </button>
          </div>
        )}
      </div>
    </div>
  );
}