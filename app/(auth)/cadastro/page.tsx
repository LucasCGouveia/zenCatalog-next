import { RegisterForm } from "@/src/auth/components/RegisterForm";
import { Sparkles } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-blue-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            ZenCatalog <Sparkles className="text-blue-400" />
          </h1>
          <p className="text-blue-300/60 font-medium">Inicie sua jornada de organização e luz.</p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}