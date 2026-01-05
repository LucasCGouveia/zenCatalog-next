// app/(dashboard)/layout.tsx
export const dynamic = 'force-dynamic'; // Adicione aqui!

import { Sidebar } from "@/modulos/layout/components/Sidebar";
import { Header } from "@/modulos/layout/components/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-blue-950 overflow-hidden text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Header />
        <main className="flex-1 overflow-y-auto bg-blue-950 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}