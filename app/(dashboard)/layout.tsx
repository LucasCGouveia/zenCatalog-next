import { Sidebar } from "@/modulos/layout/components/Sidebar";
import { Header } from "@/modulos/layout/components/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden text-gray-100">
      {/* Luz de fundo sutil no canto superior */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] pointer-events-none" />
      
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Header />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {children}
        </main>
      </div>
    </div>
  );
}