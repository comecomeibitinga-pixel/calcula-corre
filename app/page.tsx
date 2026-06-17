"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, Profile, Ganho, Despesa, calcularMediaCombustivel } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Bike, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  Calendar,
  Layers,
  Fuel,
  Wrench,
  Percent
} from "lucide-react";

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ganhos, setGanhos] = useState<Ganho[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [showLocalWarning, setShowLocalWarning] = useState(true);

  const checkSession = async () => {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session?.user);
    } else {
      setIsLoggedIn(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await db.getProfile();
      const g = await db.getGanhos();
      const d = await db.getDespesas();
      
      setProfile(p);
      setGanhos(g);
      setDespesas(d);
    } catch (err) {
      console.error("Erro ao carregar dados do painel", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    checkSession();

    // Ouvir atualizações de login/logout/perfil
    const handleProfileUpdate = () => {
      loadData();
      checkSession();
    };

    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, []);

  const handleDeleteGanho = async (id: string) => {
    if (confirm("Quer mesmo excluir este ganho?")) {
      try {
        await db.deleteGanho(id);
        await loadData();
      } catch (err: any) {
        console.error("Erro ao deletar ganho:", err);
        alert("Erro ao excluir. Se você estiver logado, verifique a conexão ou as políticas de segurança (RLS) no Supabase.");
      }
    }
  };

  const handleDeleteDespesa = async (id: string) => {
    if (confirm("Quer mesmo excluir esta despesa?")) {
      try {
        await db.deleteDespesa(id);
        await loadData();
        // Dispatch profile update in case km changed
        window.dispatchEvent(new Event("profile-updated"));
      } catch (err: any) {
        console.error("Erro ao deletar despesa:", err);
        alert("Erro ao excluir. Se você estiver logado, verifique a conexão ou as políticas de segurança (RLS) no Supabase.");
      }
    }
  };

  // Helper date conversions
  const todayStr = new Date().toISOString().split("T")[0];
  
  const getDaysAgoStr = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split("T")[0];
  };
  const sevenDaysAgoStr = getDaysAgoStr(7);

  // Today calculations
  const ganhosHoje = ganhos
    .filter(g => g.data === todayStr)
    .reduce((sum, g) => sum + g.valor, 0);

  // Weekly calculations (last 7 days)
  const ganhosSemana = ganhos
    .filter(g => g.data >= sevenDaysAgoStr)
    .reduce((sum, g) => sum + g.valor, 0);

  const despesasSemana = despesas
    .filter(d => d.data >= sevenDaysAgoStr)
    .reduce((sum, d) => sum + d.valor, 0);

  const lucroSemana = ganhosSemana - despesasSemana;

  // Fuel economy calculation
  const fuelStats = calcularMediaCombustivel(despesas);

  // Oil change calculation
  const getOilProgress = () => {
    if (!profile) return { pct: 0, restante: 0, isCritical: false };
    const percorrido = profile.km_atual - profile.ultima_troca_oleo_km;
    const restante = Math.max(0, profile.troca_oleo_intervalo - percorrido);
    const pct = Math.max(0, Math.min(100, (restante / profile.troca_oleo_intervalo) * 100));
    return {
      pct: parseFloat(pct.toFixed(0)),
      restante,
      isCritical: restante <= 150
    };
  };

  const oilInfo = getOilProgress();

  // Combined last 4 transactions
  const formatRecentItems = () => {
    const mappedGanhos = ganhos.map(g => ({
      id: g.id,
      tipo: "ganho" as const,
      categoria: g.categoria,
      valor: g.valor,
      data: g.data,
      descricao: g.descricao || "Entrega",
    }));

    const mappedDespesas = despesas.map(d => ({
      id: d.id,
      tipo: "despesa" as const,
      categoria: d.tipo === "Combustível" ? "Combustível" : d.categoria_manutencao || d.tipo,
      valor: d.valor,
      data: d.data,
      descricao: d.descricao || (d.tipo === "Combustível" ? "Abastecimento" : "Manutenção"),
    }));

    return [...mappedGanhos, ...mappedDespesas]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 4);
  };

  const recentItems = formatRecentItems();

  const getCategoriaConfig = (cat: string) => {
    const config: Record<string, { color: string; active: string }> = {
      iFood: { color: "bg-red-500/10 text-red-500 border-red-500/25", active: "bg-red-600 text-white border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]" },
      Uber: { color: "bg-green-500/10 text-green-500 border-green-500/25", active: "bg-green-600 text-white border-green-600 shadow-[0_0_8px_rgba(34,197,94,0.4)]" },
      "Lanchonete Fixa": { color: "bg-amber-500/10 text-amber-500 border-amber-500/25", active: "bg-amber-500 text-slate-950 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" },
      Particular: { color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/25", active: "bg-indigo-600 text-white border-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]" },
    };
    if (config[cat]) return config[cat];
    return {
      color: "bg-violet-500/10 text-violet-400 border-violet-500/25",
      active: "bg-violet-600 text-white border-violet-600 shadow-[0_0_8px_rgba(139,92,246,0.4)]"
    };
  };

  const getConsistencyStats = () => {
    let successDays = 0;
    const metaVal = profile?.meta_diaria || 150;
    for (let i = 0; i < 7; i++) {
      const dayStr = getDaysAgoStr(i);
      const dayGains = ganhos
        .filter(g => g.data === dayStr)
        .reduce((sum, g) => sum + g.valor, 0);
      if (dayGains >= metaVal) {
        successDays++;
      }
    }
    return { successDays };
  };

  const getWeeklyBreakdown = () => {
    const breakdown: Record<string, number> = {};
    let totalWeeklyGains = 0;
    
    ganhos
      .filter(g => g.data >= sevenDaysAgoStr)
      .forEach(g => {
        breakdown[g.categoria] = (breakdown[g.categoria] || 0) + g.valor;
        totalWeeklyGains += g.valor;
      });

    return Object.entries(breakdown)
      .map(([categoria, valor]) => ({
        categoria,
        valor,
        pct: totalWeeklyGains > 0 ? (valor / totalWeeklyGains) * 100 : 0
      }))
      .sort((a, b) => b.valor - a.valor);
  };

  const consistency = getConsistencyStats();
  const weeklyBreakdown = getWeeklyBreakdown();

  const metaDiaria = profile?.meta_diaria || 150;
  const metaProgresso = Math.min(100, (ganhosHoje / metaDiaria) * 100);
  const faltaMeta = Math.max(0, metaDiaria - ganhosHoje);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium text-sm">Carregando painel do corre...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerta de Modo Local / Deslogado */}
      {!isLoggedIn && showLocalWarning && (
        <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/35 rounded-2xl p-4 shadow-md relative overflow-hidden flex items-start gap-3.5 animate-fadeIn">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-lg pointer-events-none"></div>
          
          <div className="p-2 rounded-xl bg-amber-500/15 text-accent-warning shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          
          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wide">Salvando Localmente</h4>
            <p className="text-[10.5px] text-slate-300 leading-normal">
              Você não está logado! Seus dados estão salvos <strong className="text-white font-bold">apenas neste celular</strong>. Para não perder seu histórico se trocar de aparelho, <Link href="/login" className="text-accent-primary hover:underline font-bold">crie uma conta ou faça login</Link>.
            </p>
          </div>
          
          <button 
            onClick={() => setShowLocalWarning(false)}
            className="text-slate-500 hover:text-slate-300 text-xs font-black p-1 transition-colors self-start"
            title="Fechar aviso"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Meta Diária Tracker */}
      <section className="bg-card border border-border rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent-primary/5 rounded-full blur-xl pointer-events-none"></div>
        
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Meta Diária</h3>
            <p className="text-2xl font-black text-slate-100 mt-0.5">
              R$ {ganhosHoje.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              <span className="text-xs text-slate-400 font-normal"> / R$ {metaDiaria.toLocaleString("pt-BR")}</span>
            </p>
          </div>
          <div className="bg-slate-900 border border-border px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block font-medium">Progresso</span>
            <span className="text-sm font-black text-accent-primary">{metaProgresso.toFixed(0)}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-3.5 border border-border overflow-hidden p-[2px]">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-accent-primary to-green-500 shadow-[0_0_8px_rgba(250,204,21,0.4)] transition-all duration-500"
            style={{ width: `${metaProgresso}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-border/40 text-[11px] text-slate-400">
          <div>
            {faltaMeta > 0 ? (
              <span className="flex items-center gap-1.5">
                🚀 Faltam <strong className="text-accent-primary font-bold">R$ {faltaMeta.toFixed(2)}</strong> hoje
              </span>
            ) : (
              <span className="text-accent-success font-bold flex items-center gap-1.5">
                🎉 Meta batida hoje! 🚀
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 bg-slate-900/60 border border-border/50 px-2 py-0.5 rounded-lg text-[10px] font-extrabold text-amber-400 select-none">
            <span>🔥 {consistency.successDays}/7 dias batidos</span>
          </div>
        </div>
      </section>

      {/* 2. Resumo da Semana (Cards) */}
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-2xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-accent-success">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Semana</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <span className="text-[9px] text-slate-400 block">Ganhos</span>
            <span className="text-sm font-black text-accent-success truncate block">
              R$ {ganhosSemana.toFixed(0)}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-accent-danger">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Gastos</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <span className="text-[9px] text-slate-400 block">Despesas</span>
            <span className="text-sm font-black text-accent-danger truncate block">
              R$ {despesasSemana.toFixed(0)}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-3 flex flex-col justify-between shadow-md relative overflow-hidden">
          <div className={`flex items-center justify-between ${lucroSemana >= 0 ? "text-accent-primary" : "text-accent-danger"}`}>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Lucro</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <span className="text-[9px] text-slate-400 block">Líquido</span>
            <span className={`text-sm font-black truncate block ${lucroSemana >= 0 ? "text-accent-primary" : "text-accent-danger"}`}>
              R$ {lucroSemana.toFixed(0)}
            </span>
          </div>
        </div>
      </section>

      {/* 2.5 Divisão por Aplicativo */}
      {ganhosSemana > 0 && (
        <section className="bg-card border border-border rounded-2xl p-4 shadow-md">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-accent-primary" /> Faturamento por App (Últimos 7 dias)
          </h3>
          
          <div className="space-y-3">
            {weeklyBreakdown.map((item) => {
              const isDefault = ["iFood", "Uber", "Lanchonete Fixa", "Particular"].includes(item.categoria);
              return (
                <div key={item.categoria} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-200">{item.categoria}</span>
                    <span className="text-slate-400">
                      R$ {item.valor.toFixed(2)} <span className="text-[10px] text-slate-500">({item.pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-border/50">
                    <div 
                      className={`h-full rounded-full transition-all duration-500`}
                      style={{ 
                        width: `${item.pct}%`,
                        backgroundColor: item.categoria === "iFood" ? "#ef4444" : 
                                         item.categoria === "Uber" ? "#22c55e" :
                                         item.categoria === "Lanchonete Fixa" ? "#f59e0b" :
                                         item.categoria === "Particular" ? "#6366f1" : "#8b5cf6"
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Ações Rápidas (2 Cliques) */}
      <section className="grid grid-cols-2 gap-4">
        <Link 
          href="/ganhos"
          className="bg-gradient-to-br from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 border border-green-500/20 text-white rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg active:scale-95 transition-all duration-150 select-none py-5"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-inner">
            <Plus className="w-6 h-6 text-white stroke-[3]" />
          </div>
          <span className="text-sm font-black tracking-wide uppercase">Lançar Ganho</span>
          <span className="text-[9px] text-green-200 mt-0.5">iFood, Uber, etc.</span>
        </Link>

        <Link 
          href="/despesas"
          className="bg-gradient-to-br from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 border border-red-500/20 text-white rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg active:scale-95 transition-all duration-150 select-none py-5"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-inner">
            <TrendingDown className="w-6 h-6 text-white stroke-[3]" />
          </div>
          <span className="text-sm font-black tracking-wide uppercase">Lançar Gasto</span>
          <span className="text-[9px] text-red-200 mt-0.5">Gasolina e Peças</span>
        </Link>
      </section>

      {/* 4. Alerta de Óleo & KM */}
      {profile && (
        <section className="bg-card border border-border rounded-2xl p-4 shadow-md">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Bike className="w-4 h-4 text-accent-primary" /> Saúde da Moto
          </h3>
          
          <div className="space-y-4">
            {/* Odometer quick show */}
            <div className="flex justify-between items-center bg-slate-900/60 border border-border/50 px-3 py-2 rounded-xl">
              <div>
                <span className="text-[9px] text-slate-400 block uppercase font-medium">Troca de Óleo Anterior</span>
                <span className="text-xs font-bold text-slate-200">{profile.ultima_troca_oleo_km.toLocaleString()} km</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block uppercase font-medium">Troca Programada</span>
                <span className="text-xs font-bold text-accent-primary">
                  {(profile.ultima_troca_oleo_km + profile.troca_oleo_intervalo).toLocaleString()} km
                </span>
              </div>
            </div>

            {/* Oil progress bar */}
            <div>
              <div className="flex justify-between text-[10px] font-bold mb-1.5">
                <span className="text-slate-400">Vida Útil do Óleo</span>
                <span className={oilInfo.isCritical ? "text-accent-danger" : "text-accent-success"}>
                  {oilInfo.pct}% restante ({oilInfo.restante} km)
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-border/50">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    oilInfo.isCritical 
                      ? "bg-accent-danger shadow-[0_0_6px_rgba(239,68,68,0.4)]" 
                      : "bg-accent-success"
                  }`}
                  style={{ width: `${oilInfo.pct}%` }}
                ></div>
              </div>
            </div>

            {/* Média de combustível */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/50">
              <div className="bg-slate-900/40 p-2.5 rounded-xl border border-border/30">
                <span className="text-[9px] text-slate-400 uppercase block font-semibold flex items-center gap-1">
                  <Fuel className="w-3 h-3 text-accent-info" /> Média Consumo
                </span>
                <span className="text-base font-black text-slate-200 mt-1 block">
                  {fuelStats.kmPorLitro > 0 ? `${fuelStats.kmPorLitro} km/L` : "Falta dados"}
                </span>
                <span className="text-[8px] text-slate-400 block -mt-0.5">Baseado em abastecimentos</span>
              </div>

              <div className="bg-slate-900/40 p-2.5 rounded-xl border border-border/30 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block font-semibold flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-accent-warning" /> Manutenção
                  </span>
                  <span className="text-xs font-bold text-slate-300 mt-1 block truncate">
                    {despesas.find(d => d.tipo === "Manutenção")?.descricao || "Sem registros"}
                  </span>
                </div>
              </div>
            </div>

            {/* Alerta Visual de Óleo */}
            {oilInfo.isCritical && (
              <div className="bg-accent-danger/10 border border-accent-danger/30 rounded-xl p-3 flex items-start gap-3 mt-2 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-accent-danger shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-accent-danger uppercase">⚠️ ATENÇÃO: TROCA DE ÓLEO</h4>
                  <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                    Você rodou <strong className="text-white font-bold">{profile.km_atual - profile.ultima_troca_oleo_km} km</strong> desde a última troca. 
                    {oilInfo.restante <= 0 ? " O prazo venceu! Faça a troca do óleo agora para não estragar o motor!" : ` Faltam apenas ${oilInfo.restante} km para o limite da troca.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 5. Últimas Atividades (Histórico Rápido) */}
      <section className="bg-card border border-border rounded-2xl p-4 shadow-md">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-accent-primary" /> Corre Recentes
          </h3>
          <Link href="/historico" className="text-[10px] text-accent-primary hover:underline font-bold transition-all">
            Ver Tudo
          </Link>
        </div>

        {recentItems.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-border rounded-xl">
            <p className="text-xs text-slate-400">Nenhum corre registrado ainda.</p>
            <p className="text-[10px] text-slate-400 mt-1">Lançe os primeiros ganhos ou gastos acima! 🏍️</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentItems.map((item) => {
              const isGanho = item.tipo === "ganho";
              const formattedDate = new Date(item.data + "T12:00:00").toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
              });

              return (
                <div 
                  key={item.id}
                  className="flex items-center justify-between bg-slate-900/50 hover:bg-slate-900 border border-border/40 p-2.5 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isGanho 
                        ? "bg-accent-success/15 text-accent-success" 
                        : "bg-accent-danger/15 text-accent-danger"
                    }`}>
                      {isGanho ? "+" : "-"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200">{item.categoria}</span>
                        <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-semibold uppercase">{formattedDate}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate block max-w-[180px] mt-0.5">{item.descricao}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-black ${isGanho ? "text-accent-success" : "text-accent-danger"}`}>
                      {isGanho ? "" : "-"} R$ {item.valor.toFixed(2)}
                    </span>
                    <button
                      onClick={() => isGanho ? handleDeleteGanho(item.id) : handleDeleteDespesa(item.id)}
                      className="text-slate-500 hover:text-accent-danger p-1 rounded-md active:scale-90 transition-all"
                      title="Excluir item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
