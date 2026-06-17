"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { db, Profile } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { AlertTriangle, LogOut, Key } from "lucide-react";

export default function Header() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      const p = await db.getProfile();
      setProfile(p);

      // Obter email do usuário autenticado no Supabase
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        setEmail(data.session?.user?.email || null);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do cabeçalho", err);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      if (confirm("Quer mesmo sair da sua conta?")) {
        await supabase.auth.signOut();
        setEmail(null);
        window.dispatchEvent(new Event("profile-updated"));
        window.location.reload();
      }
    }
  };

  useEffect(() => {
    fetchProfile();

    // Ouvir atualizações de perfil
    const handleProfileUpdate = () => {
      fetchProfile();
    };

    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, []);

  const getOilStatus = () => {
    if (!profile) return null;
    const percorrido = profile.km_atual - profile.ultima_troca_oleo_km;
    const restante = profile.troca_oleo_intervalo - percorrido;

    if (restante <= 0) {
      return {
        text: "TROCAR ÓLEO JÁ!",
        style: "bg-accent-danger/20 text-accent-danger border-accent-danger/40 animate-pulse",
        icon: true,
      };
    } else if (restante <= 150) {
      return {
        text: `Óleo: Faltam ${restante} km`,
        style: "bg-accent-warning/20 text-accent-warning border-accent-warning/40",
        icon: true,
      };
    } else {
      return {
        text: `Faltam ${restante} km p/ óleo`,
        style: "bg-slate-800 text-slate-300 border-border",
        icon: false,
      };
    }
  };

  const oilStatus = getOilStatus();

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between shadow-sm select-none">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-md border border-slate-800/80 bg-slate-950">
          <Image
            src="/icon.png"
            alt="CalculaCorre Logo"
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-accent-primary to-amber-400 bg-clip-text text-transparent">
            CalculaCorre
          </h1>
          <span className="text-[9px] text-slate-400 font-medium uppercase tracking-widest block -mt-1">
            Giro Financeiro
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {profile && (
          <div className="flex flex-col items-end gap-0.5">
            <div className="text-[11px] font-semibold text-slate-300 bg-slate-900 border border-border px-2 py-0.5 rounded-full">
              🏍️ {profile.km_atual.toLocaleString("pt-BR")} km
            </div>
            
            {oilStatus && (
              <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${oilStatus.style}`}>
                {oilStatus.icon && <AlertTriangle className="w-3.5 h-3.5" />}
                <span>{oilStatus.text}</span>
              </div>
            )}
          </div>
        )}

        {/* Painel de Autenticação */}
        <div className="flex flex-col items-center justify-center pl-2.5 border-l border-border/80 h-9 min-w-[36px]">
          {email ? (
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-slate-500 font-black max-w-[50px] truncate" title={email}>
                {email.split("@")[0]}
              </span>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-accent-danger p-0.5 rounded transition-colors"
                title="Sair do CalculaCorre"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="text-slate-400 hover:text-accent-primary flex flex-col items-center"
              title="Entrar na Nuvem"
            >
              <Key className="w-4 h-4 text-slate-400 hover:text-accent-primary" />
              <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5 text-slate-500">Entrar</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

