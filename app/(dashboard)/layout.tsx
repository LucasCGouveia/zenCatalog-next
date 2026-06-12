// app/(dashboard)/layout.tsx
export const dynamic = 'force-dynamic'; // Adicione aqui!

import { Sidebar } from "@/src/layout/components/Sidebar";
import { Header } from "@/src/layout/components/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-blue-950 text-slate-100">
      <Sidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-h-0 flex-1 overflow-y-auto bg-blue-950 p-3 pb-24 sm:p-5 sm:pb-24 md:p-6 md:pb-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
