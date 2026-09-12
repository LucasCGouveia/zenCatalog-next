import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  FileSearch,
  FolderInput,
  LibraryBig,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "ZenCatalog | Organização inteligente de conteúdo",
  description:
    "Organize, catalogue e encontre vídeos, documentos e outros conteúdos digitais com automação e inteligência artificial.",
};

const steps = [
  {
    icon: FolderInput,
    title: "Conecte seu conteúdo",
    description: "Adicione os arquivos e conteúdos digitais que você deseja manter organizados.",
  },
  {
    icon: Bot,
    title: "Processamos e catalogamos",
    description: "Automações e inteligência artificial ajudam a analisar e gerar informações úteis.",
  },
  {
    icon: FileSearch,
    title: "Encontre tudo organizado",
    description: "Consulte seu acervo com nomes, categorias, resumos e metadados mais claros.",
  },
];

export default function OAuthPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.32),transparent_42%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-10 lg:py-32">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-200">
              <Sparkles aria-hidden="true" size={16} />
              ZenCatalog
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Organize, catalogue e encontre seus conteúdos com inteligência.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/75 sm:text-xl">
              O ZenCatalog auxilia na organização de vídeos, documentos e outros conteúdos digitais usando automações e inteligência artificial para transformar arquivos dispersos em um acervo fácil de consultar.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-xl shadow-blue-950/40 outline-none transition-colors hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950"
              >
                Entrar no ZenCatalog
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link
                href="/privacy"
                className="inline-flex items-center rounded-2xl border border-white/15 px-6 py-3.5 font-bold text-blue-100 outline-none transition-colors hover:border-blue-400/60 hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                Conhecer a privacidade
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
            <div className="absolute -inset-8 rounded-full bg-blue-600/20 blur-3xl" />
            <div className="relative rounded-[2.5rem] border border-white/15 bg-white/10 p-8 shadow-2xl shadow-black/25 backdrop-blur-sm sm:p-10">
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                <LibraryBig size={32} />
              </div>
              <div className="space-y-4">
                <div className="h-4 w-2/3 rounded-full bg-white/80" />
                <div className="h-3 w-full rounded-full bg-blue-300/30" />
                <div className="h-3 w-5/6 rounded-full bg-blue-300/20" />
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-blue-500/15 p-4"><FileSearch className="text-blue-300" /></div>
                <div className="rounded-2xl bg-blue-500/15 p-4"><Sparkles className="text-blue-300" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="como-funciona" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-400">Uma jornada simples</p>
          <h2 id="como-funciona" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Como funciona</h2>
        </div>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="rounded-3xl border border-white/10 bg-white/[0.06] p-7">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white"><Icon aria-hidden="true" size={24} /></div>
                  <span className="text-sm font-black text-blue-300/60">0{index + 1}</span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-white">{step.title}</h3>
                <p className="mt-3 leading-7 text-blue-100/65">{step.description}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="google-drive" className="border-y border-white/10 bg-slate-950/20">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:px-8 md:grid-cols-[auto_1fr] md:items-start lg:px-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-300"><FolderInput aria-hidden="true" size={28} /></div>
          <div className="max-w-3xl">
            <h2 id="google-drive" className="text-3xl font-black tracking-tight">Integração com Google Drive</h2>
            <p className="mt-5 text-lg leading-8 text-blue-100/70">
              Quando você autoriza uma integração Google, determinadas automações do ZenCatalog podem localizar, acessar e organizar arquivos no Google Drive para executar a funcionalidade solicitada. Isso pode incluir obter informações, processar um arquivo autorizado ou aplicar um nome organizado. O acesso é usado dentro das permissões concedidas por você — não representa acesso irrestrito à sua conta Google.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="privacidade" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
        <div className="rounded-[2.5rem] border border-blue-400/20 bg-blue-600/10 p-7 sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 text-blue-300"><ShieldCheck aria-hidden="true" size={28} /><LockKeyhole aria-hidden="true" size={22} /></div>
            <h2 id="privacidade" className="mt-5 text-3xl font-black tracking-tight">Privacidade em primeiro lugar</h2>
            <p className="mt-4 text-lg leading-8 text-blue-100/70">
              O acesso às APIs Google é utilizado apenas para fornecer ou melhorar funcionalidades solicitadas e explicitamente autorizadas. Entenda como os dados são processados e conheça as condições de uso antes de começar.
            </p>
          </div>
          <div className="mt-8 flex shrink-0 flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col">
            <Link href="/privacy" className="rounded-xl bg-white px-5 py-3 text-center font-bold text-blue-950 outline-none transition-colors hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-300">Política de Privacidade</Link>
            <Link href="/terms" className="rounded-xl border border-white/20 px-5 py-3 text-center font-bold text-white outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-300">Termos de Serviço</Link>
          </div>
        </div>
      </section>
    </>
  );
}
