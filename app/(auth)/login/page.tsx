"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, LogIn, Loader2, Sparkles } from "lucide-react";
import Link from "next/link"; // Importante: É isso que faz a navegação funcionar

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      alert("Login falhou! Verifique seu e-mail e senha.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-blue-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Cabeçalho igual ao do Cadastro */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            ZenCatalog <Sparkles className="text-blue-400" />
          </h1>
          <p className="text-blue-300/60 font-medium">Bem-vindo de volta à sua jornada.</p>
        </div>

        {/* Formulário de Login */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-4">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-4">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>Entrar no Sistema <LogIn size={18} /></>
              )}
            </button>
          </form>

          {/* O Link CORRIGIDO para a página de cadastro */}
          <div className="text-center pt-2">
            <p className="text-sm text-slate-400 font-medium mb-2">Ainda não tem conta?</p>
            <Link
              href="/cadastro"
              className="inline-block text-blue-600 font-black hover:text-blue-700 transition-colors border-b-2 border-blue-100 hover:border-blue-600 pb-0.5"
            >
              Criar conta agora
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}