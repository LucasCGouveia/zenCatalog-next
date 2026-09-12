import { PublicFooter } from "@/src/legal/components/PublicFooter";
import { PublicHeader } from "@/src/legal/components/PublicHeader";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-blue-950 text-white">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
