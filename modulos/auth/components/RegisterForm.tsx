"use client";

import { useState } from "react";
// Pode remover o useRouter se quiser, ou deixá-lo aí sem uso
// import { useRouter } from "next/navigation"; 
import { registerUserAction } from "../actions/authActions";
import { User, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export const RegisterForm = () => {
  const [loading, setLoading] = useState(false);
  // const router = useRouter(); // Não vamos mais usar o router aqui

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await registerUserAction(formData);

    if (result.error) {
      alert(result.error);
      setLoading(false);
    } else {
      // MUDANÇA AQUI:
      // Em vez de router.push("/login"), usamos window.location.href
      // Isso garante que a página de login carregue do zero, sem erros de roteamento.
      alert("Conta criada com sucesso! Faça seu login.");
      window.location.href = "/login"; 
    }
  };

  // ... (o resto do return continua igual)
  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ... seus inputs continuam iguais ... */}
        
        {/* (Vou resumir para não ocupar espaço, mantenha seus inputs de Nome, Email e Senha aqui) */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-4">Nome Completo</label>
           <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input name="name" type="text" required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900" placeholder="Como quer ser chamado?" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-4">E-mail</label>
           <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input name="email" type="email" required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900" placeholder="seu@email.com" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-4">Senha</label>
           <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input name="password" type="password" required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900" placeholder="••••••••" />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 mt-4"
        >
          {loading ? <Loader2 className="animate-spin" /> : (
            <>Criar minha conta <ArrowRight size={18} /></>
          )}
        </button>
      </form>

      <div className="text-center">
        <p className="text-sm text-slate-400 font-medium">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-blue-600 font-bold hover:underline">Entre aqui</Link>
        </p>
      </div>
    </div>
  );
};