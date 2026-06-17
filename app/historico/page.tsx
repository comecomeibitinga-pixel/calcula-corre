"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, Ganho, Despesa } from "@/lib/db";
import { 
  ArrowLeft, 
  Search, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Filter,
  Layers
} from "lucide-react";

interface ActivityItem {
  id: string;
  tipo: "ganho" | "despesa";
  valor: number;
  categoria: string;
  descricao: string;
  data: string;
}

export default function HistoricoPage() {
  const [ganhos, setGanhos] = useState<Ganho[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters state
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | "ganhos" | "despesas">("todos");
  const [periodoFiltro, setPeriodoFiltro] = useState<"todos" | "hoje" | "7dias" | "30dias">("todos");
  const [appFiltro, setAppFiltro] = useState<string>("todos");
  
  // Available applications/categories for filtering
  const [plataformas, setPlataformas] = useState<string[]>([]);

  const loadDados = async () => {
    setLoading(true);
    try {
      const gList = await db.getGanhos();
      const dList = await db.getDespesas();
      setGanhos(gList);
      setDespesas(dList);
      
      // Load apps list
      const pList = db.getPlataformas();
      setPlataformas(pList);
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDados();
  }, []);

  const handleDelete = async (item: ActivityItem) => {
    const confirmMessage = item.tipo === "ganho" 
      ? `Excluir o ganho de R$ ${item.valor.toFixed(2)} (${item.categoria})?`
      : `Excluir a despesa de R$ ${item.valor.toFixed(2)} (${item.categoria})?`;

    if (confirm(confirmMessage)) {
      try {
        if (item.tipo === "ganho") {
          await db.deleteGanho(item.id);
        } else {
          await db.deleteDespesa(item.id);
        }
        await loadDados();
        // Notify header to update balance
        window.dispatchEvent(new Event("profile-updated"));
      } catch (err) {
        console.error("Erro ao excluir item:", err);
        alert("Erro ao excluir o item. Verifique sua conexão.");
      }
    }
  };

  // Helper date generators
  const getDaysAgoStr = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  };

  const todayStr = getDaysAgoStr(0);
  const sevenDaysAgoStr = getDaysAgoStr(7);
  const thirtyDaysAgoStr = getDaysAgoStr(30);

  // Combine and filter items
  const getFilteredItems = (): ActivityItem[] => {
    const combined: ActivityItem[] = [];

    // Map gains
    ganhos.forEach(g => {
      combined.push({
        id: g.id,
        tipo: "ganho",
        valor: g.valor,
        categoria: g.categoria,
        descricao: g.descricao || `Ganho ${g.categoria}`,
        data: g.data
      });
    });

    // Map expenses
    despesas.forEach(d => {
      combined.push({
        id: d.id,
        tipo: "despesa",
        valor: d.valor,
        categoria: d.tipo + (d.tipo === "Combustível" ? "" : d.categoria_manutencao ? ` (${d.categoria_manutencao})` : ""),
        descricao: d.descricao || d.tipo,
        data: d.data
      });
    });

    // Sort by date descending, then ID to guarantee order consistency
    let items = combined.sort((a, b) => {
      const dateCompare = new Date(b.data).getTime() - new Date(a.data).getTime();
      if (dateCompare !== 0) return dateCompare;
      return b.id.localeCompare(a.id);
    });

    // Filter by Type
    if (tipoFiltro === "ganhos") {
      items = items.filter(i => i.tipo === "ganho");
    } else if (tipoFiltro === "despesas") {
      items = items.filter(i => i.tipo === "despesa");
    }

    // Filter by Period
    if (periodoFiltro === "hoje") {
      items = items.filter(i => i.data === todayStr);
    } else if (periodoFiltro === "7dias") {
      items = items.filter(i => i.data >= sevenDaysAgoStr);
    } else if (periodoFiltro === "30dias") {
      items = items.filter(i => i.data >= thirtyDaysAgoStr);
    }

    // Filter by App/Category (only for Ganhos usually, or matched categories)
    if (appFiltro !== "todos") {
      items = items.filter(i => i.categoria.toLowerCase().includes(appFiltro.toLowerCase()));
    }

    // Filter by text search
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i => 
        i.descricao.toLowerCase().includes(q) ||
        i.categoria.toLowerCase().includes(q) ||
        i.valor.toString().includes(q)
      );
    }

    return items;
  };

  const filteredItems = getFilteredItems();

  // Stats calculation
  const totalGanhos = filteredItems
    .filter(i => i.tipo === "ganho")
    .reduce((sum, i) => sum + i.valor, 0);

  const totalDespesas = filteredItems
    .filter(i => i.tipo === "despesa")
    .reduce((sum, i) => sum + i.valor, 0);

  const saldoLiquido = totalGanhos - totalDespesas;

  const getCategoriaConfig = (cat: string) => {
    const config: Record<string, { color: string }> = {
      iFood: { color: "bg-red-500/10 text-red-400 border-red-500/25" },
      Uber: { color: "bg-green-500/10 text-green-400 border-green-500/25" },
      "Lanchonete Fixa": { color: "bg-amber-500/10 text-amber-400 border-amber-500/25" },
      Particular: { color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25" },
      Combustível: { color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25" },
      Manutenção: { color: "bg-orange-500/10 text-orange-400 border-orange-500/25" },
    };
    if (config[cat]) return config[cat];
    if (cat.includes("Manutenção")) return config["Manutenção"];
    return { color: "bg-violet-500/10 text-violet-400 border-violet-500/25" };
  };

  return (
    <div className="space-y-5">
      {/* Voltar button */}
      <div className="flex items-center justify-between">
        <Link href="/" className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-all">
          <ArrowLeft className="w-4 h-4" /> Painel Principal
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
          <Layers className="w-6 h-6 text-accent-primary" /> Histórico do Corre
        </h2>
        <p className="text-xs text-slate-400 mt-1">Veja e filtre todos os ganhos e gastos registrados.</p>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-3 gap-2 bg-card border border-border rounded-2xl p-3 shadow-md">
        <div className="text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Ganhos</span>
          <span className="text-xs font-extrabold text-accent-success mt-1 block">
            R$ {totalGanhos.toFixed(0)}
          </span>
        </div>
        <div className="text-center border-x border-border/50">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Despesas</span>
          <span className="text-xs font-extrabold text-accent-danger mt-1 block">
            R$ {totalDespesas.toFixed(0)}
          </span>
        </div>
        <div className="text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Saldo</span>
          <span className={`text-xs font-black mt-1 block ${saldoLiquido >= 0 ? "text-accent-primary" : "text-accent-danger"}`}>
            R$ {saldoLiquido.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Filters Form */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-md space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por descrição, valor ou app..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/60 border border-border rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-accent-primary transition-all"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Type Filter */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Tipo</label>
            <select
              value={tipoFiltro}
              onChange={(e: any) => setTipoFiltro(e.target.value)}
              className="w-full bg-slate-900/60 border border-border rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-accent-primary"
            >
              <option value="todos">Todos</option>
              <option value="ganhos">Ganhos (Entrada)</option>
              <option value="despesas">Despesas (Saída)</option>
            </select>
          </div>

          {/* Period Filter */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Período</label>
            <select
              value={periodoFiltro}
              onChange={(e: any) => setPeriodoFiltro(e.target.value)}
              className="w-full bg-slate-900/60 border border-border rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-accent-primary"
            >
              <option value="todos">Todo período</option>
              <option value="hoje">Hoje</option>
              <option value="7dias">Últimos 7 dias</option>
              <option value="30dias">Últimos 30 dias</option>
            </select>
          </div>
        </div>

        {/* App selector (Visible when Tipo is not Despesas) */}
        {tipoFiltro !== "despesas" && (
          <div className="space-y-1.5 pt-1.5 border-t border-border/40">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Filtro de Aplicativo</label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-border">
              <button
                type="button"
                onClick={() => setAppFiltro("todos")}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
                  appFiltro === "todos"
                    ? "bg-accent-primary text-slate-950 border-accent-primary shadow-[0_0_8px_rgba(79,70,229,0.4)]"
                    : "bg-slate-900 text-slate-400 border-border hover:border-slate-700"
                }`}
              >
                Todos
              </button>
              {plataformas.map((plat) => (
                <button
                  key={plat}
                  type="button"
                  onClick={() => setAppFiltro(plat)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap ${
                    appFiltro === plat
                      ? "bg-accent-primary text-slate-950 border-accent-primary shadow-[0_0_8px_rgba(79,70,229,0.4)]"
                      : "bg-slate-900 text-slate-400 border-border hover:border-slate-700"
                  }`}
                >
                  {plat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* List content */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2.5">
            <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 font-medium">Lendo dados...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-card/50">
            <p className="text-xs text-slate-400">Nenhum registro encontrado.</p>
            <p className="text-[10px] text-slate-500 mt-1">Tente ajustar seus filtros de busca ou período.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const isGanho = item.tipo === "ganho";
              const formattedDate = new Date(item.data + "T12:00:00").toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
              });
              const config = getCategoriaConfig(item.categoria);

              return (
                <div
                  key={`${item.tipo}-${item.id}`}
                  className="bg-card border border-border/80 hover:border-border rounded-xl p-3 flex items-center justify-between shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      isGanho ? "bg-accent-success/10 text-accent-success" : "bg-accent-danger/10 text-accent-danger"
                    }`}>
                      {isGanho ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${config.color}`}>
                          {item.categoria}
                        </span>
                        <span className="text-[8px] text-slate-500 font-bold">{formattedDate}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-200 mt-1 truncate">
                        {item.descricao}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 pl-2">
                    <span className={`text-xs font-black ${
                      isGanho ? "text-accent-success" : "text-accent-danger"
                    }`}>
                      {isGanho ? "+" : "-"} R$ {item.valor.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-accent-danger hover:bg-accent-danger/10 transition-all"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
