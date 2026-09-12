import Link from "next/link";
import { Sparkles } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1fr_auto] md:items-end lg:px-10">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-lg font-black text-white">
            <Sparkles aria-hidden="true" className="text-blue-400" size={20} />
            ZenCatalog
          </div>
          <p className="max-w-md text-sm leading-6 text-blue-100/70">
            Automação e catalogação inteligente de conteúdo.
          </p>
          <p className="text-sm text-blue-100/50">© 2026 ZenCatalog.</p>
        </div>

        <nav aria-label="Navegação do rodapé" className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-blue-100/80">
          <Link className="rounded-md outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-blue-400" href="/oauth">
            Sobre
          </Link>
          <Link className="rounded-md outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-blue-400" href="/privacy">
            Política de Privacidade
          </Link>
          <Link className="rounded-md outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-blue-400" href="/terms">
            Termos de Serviço
          </Link>
        </nav>
      </div>
    </footer>
  );
}
