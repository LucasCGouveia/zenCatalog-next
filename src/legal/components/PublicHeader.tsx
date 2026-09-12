import Link from "next/link";
import { LogIn, Sparkles } from "lucide-react";

const navigation = [
  { href: "/oauth", label: "Sobre" },
  { href: "/privacy", label: "Privacidade" },
  { href: "/terms", label: "Termos" },
];

export function PublicHeader() {
  return (
    <header className="border-b border-white/10 bg-blue-950/95">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
        <Link
          href="/oauth"
          className="flex items-center gap-2 rounded-lg text-xl font-black tracking-tight text-white outline-none transition-colors hover:text-blue-200 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950"
          aria-label="ZenCatalog — página inicial"
        >
          <Sparkles aria-hidden="true" className="text-blue-400" size={22} />
          ZenCatalog
        </Link>

        <nav
          aria-label="Navegação principal"
          className="order-3 flex w-full items-center gap-x-5 gap-y-2 overflow-x-auto text-sm font-semibold text-blue-100 sm:order-2 sm:w-auto sm:overflow-visible"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-md outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/login"
          className="order-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-950/30 outline-none transition-colors hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950 sm:order-3"
        >
          Entrar
          <LogIn aria-hidden="true" size={16} />
        </Link>
      </div>
    </header>
  );
}
