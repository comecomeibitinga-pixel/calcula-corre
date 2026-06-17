"use client";

import { WifiOff, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 gap-5">
      <div className="w-16 h-16 rounded-full bg-slate-900 border border-border flex items-center justify-center shadow-lg text-accent-warning animate-bounce">
        <WifiOff className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-black text-slate-100">Sem Sinal no Corre!</h2>
        <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
          Você está sem conexão com a internet. Mas fique tranquilo! O CalculaCorre salva seus registros localmente e sincroniza quando a rede voltar.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-[200px] mt-4">
        <button
          onClick={handleReload}
          className="w-full py-3 bg-accent-primary text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
        >
          <RotateCcw className="w-4 h-4" />
          Tentar Novamente
        </button>

        <Link
          href="/"
          className="w-full py-3 bg-slate-900 border border-border text-slate-300 font-semibold text-xs rounded-xl hover:text-white active:scale-95 transition-all"
        >
          Ver Dados Locais
        </Link>
      </div>
    </div>
  );
}
