"use client";

import { useEffect, useState } from "react";
import { db, Ganho } from "@/lib/db";
import { PlusCircle, DollarSign, Calendar, Tag, FileText, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function GanhosPage() {
  const [ganhos, setGanhos] = useState<Ganho[]>([]);
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState<string>("iFood");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [plataformas, setPlataformas] = useState<string[]>([]);
  const [novaPlataforma, setNovaPlataforma] = useState("");
  const [mostrarAddPlataforma, setMostrarAddPlataforma] = useState(false);

  const loadGanhos = async () => {
    try {
      const list = await db.getGanhos();
      setGanhos(list);
    } catch (err) {
      console.error("Erro ao carregar ganhos", err);
    }
  };

  const loadPlataformas = () => {
    const list = db.getPlataformas();
    setPlataformas(list);
  };

  useEffect(() => {
    loadGanhos();
    loadPlataformas();
  }, []);

  const handleAddPlataforma = () => {
    const nome = novaPlataforma.trim();
    if (!nome) return;
    const updated = db.addPlataforma(nome);
    setPlataformas(updated);
    setCategoria(nome);
    setNovaPlataforma("");
    setMostrarAddPlataforma(false);
  };

  const handleDeletePlataforma = (nome: string) => {
    if (confirm(`Excluir a plataforma "${nome}"?`)) {
      const updated = db.deletePlataforma(nome);
      setPlataformas(updated);
      if (categoria === nome) {
        setCategoria("iFood");
      }
    }
  };

  const presets = [10, 15, 20, 30, 40, 50];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor || parseFloat(valor) <= 0) return;

    setSalvando(true);
    try {
      await db.addGanho({
        valor: parseFloat(parseFloat(valor).toFixed(2)),
        categoria,
        descricao: descricao.trim() || `Corrida ${categoria}`,
        data,
      });

      // Limpar campos
      setValor("");
      setDescricao("");
      setSucesso(true);
      setTimeout(() => setSucesso(false), 2000);
      
      // Recarregar
      loadGanhos();
      // Notificar cabeçalho
      window.dispatchEvent(new Event("profile-updated"));
    } catch (err) {
      console.error("Erro ao salvar ganho", err);
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Quer mesmo excluir este ganho?")) {
      try {
        await db.deleteGanho(id);
        await loadGanhos();
        window.dispatchEvent(new Event("profile-updated"));
      } catch (err: any) {
        console.error("Erro ao deletar ganho:", err);
        alert("Erro ao excluir. Se você estiver logado, verifique a conexão ou as políticas de segurança (RLS) no Supabase.");
      }
    }
  };

  const totalHoje = ganhos
    .filter((g) => g.data === new Date().toISOString().split("T")[0])
    .reduce((sum, g) => sum + g.valor, 0);

  const categoriasConfig: Record<string, { color: string; active: string }> = {
    iFood: { color: "bg-red-500/10 text-red-500 border-red-500/25", active: "bg-red-600 text-white border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]" },
    Uber: { color: "bg-green-500/10 text-green-500 border-green-500/25", active: "bg-green-600 text-white border-green-600 shadow-[0_0_8px_rgba(34,197,94,0.4)]" },
    "Lanchonete Fixa": { color: "bg-amber-500/10 text-amber-500 border-amber-500/25", active: "bg-amber-500 text-slate-950 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" },
    Particular: { color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/25", active: "bg-indigo-600 text-white border-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]" },
  };

  const getCategoriaConfig = (cat: string) => {
    if (categoriasConfig[cat]) return categoriasConfig[cat];
    return {
      color: "bg-violet-500/10 text-violet-400 border-violet-500/25",
      active: "bg-violet-600 text-white border-violet-600 shadow-[0_0_8px_rgba(139,92,246,0.4)]",
    };
  };

  return (
    <div className="space-y-6">
      {/* Back button and title */}
      <div className="flex items-center justify-between">
        <Link href="/" className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-all">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <span className="text-xs font-bold text-accent-success bg-accent-success/15 px-3 py-1 rounded-full">
          Hoje: R$ {totalHoje.toFixed(2)}
        </span>
      </div>

      <div>
        <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-accent-success" /> Registrar Ganhos
        </h2>
        <p className="text-xs text-slate-400 mt-1">Marque o aplicativo e lance o valor do corre.</p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-5 shadow-lg space-y-5">
        
        {/* Category selector */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Aplicativo / Canal</label>
            <button
              type="button"
              onClick={() => setMostrarAddPlataforma(!mostrarAddPlataforma)}
              className="text-[10px] text-accent-success hover:underline font-bold"
            >
              {mostrarAddPlataforma ? "✓ Fechar" : "+ Novo App"}
            </button>
          </div>

          {mostrarAddPlataforma && (
            <div className="bg-slate-900/80 p-3 rounded-xl border border-border/80 flex gap-2 items-center animate-in fade-in slide-in-from-top-1 duration-150">
              <input
                type="text"
                placeholder="Ex: Rappi, Loggi..."
                value={novaPlataforma}
                onChange={(e) => setNovaPlataforma(e.target.value)}
                className="flex-1 bg-slate-950 border border-border rounded-lg py-1.5 px-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent-success"
              />
              <button
                type="button"
                onClick={handleAddPlataforma}
                className="bg-accent-success text-slate-950 px-3 py-1.5 rounded-lg text-xs font-black uppercase active:scale-95 transition-all"
              >
                Add
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {plataformas.map((cat) => {
              const active = categoria === cat;
              const config = getCategoriaConfig(cat);
              const isDefault = ["iFood", "Uber", "Lanchonete Fixa", "Particular"].includes(cat);
              
              return (
                <div key={cat} className="relative group">
                  <button
                    type="button"
                    onClick={() => setCategoria(cat)}
                    className={`w-full py-3 px-3 rounded-xl border text-xs font-bold text-center transition-all duration-150 active:scale-95 ${
                      active ? config.active : `${config.color} bg-slate-900/40 hover:bg-slate-900`
                    }`}
                  >
                    {cat}
                  </button>
                  {!isDefault && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlataforma(cat);
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-500 opacity-80 hover:opacity-100 transition-opacity duration-150 z-10"
                      title="Excluir plataforma"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Value selector and presets */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. Valor do Corre</label>
            {valor && <span className="text-xs font-bold text-accent-success">Confirmado</span>}
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-lg">
              R$
            </div>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              required
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full bg-slate-900 border border-border rounded-xl py-3.5 pl-10 pr-4 text-xl font-black text-slate-100 placeholder-slate-600 focus:outline-none focus:border-accent-success focus:ring-1 focus:ring-accent-success/30 transition-all"
            />
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-6 gap-1.5">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setValor(p.toString())}
                className="py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-border/80 text-[11px] font-extrabold rounded-lg text-slate-300 hover:text-white active:scale-95 transition-all"
              >
                +{p}
              </button>
            ))}
          </div>
        </div>

        {/* Extra options */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" /> Data
            </label>
            <input
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full bg-slate-900/60 border border-border rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-accent-success transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" /> Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: Entrega VIP"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full bg-slate-900/60 border border-border rounded-xl py-2 px-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent-success transition-all"
            />
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={salvando}
          className={`w-full py-4 rounded-xl font-black uppercase text-sm tracking-wider shadow-lg active:scale-[0.98] transition-all duration-150 select-none ${
            sucesso 
              ? "bg-accent-success text-slate-950 font-bold" 
              : "bg-gradient-to-r from-green-500 to-emerald-600 text-slate-950 hover:from-green-400 hover:to-emerald-500"
          }`}
        >
          {salvando ? "Salvando..." : sucesso ? "✓ Lançado com Sucesso!" : "Gravar no Caixa 🏍️"}
        </button>
      </form>

      {/* History of gains */}
      <section className="bg-card border border-border rounded-2xl p-4 shadow-md">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Histórico de Ganhos</h3>
        
        {ganhos.length === 0 ? (
          <p className="text-center py-6 text-xs text-slate-500">Nenhum ganho registrado.</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {ganhos.map((g) => {
              const formattedDate = new Date(g.data + "T12:00:00").toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
              });
              
              return (
                <div key={g.id} className="flex justify-between items-center bg-slate-900/40 border border-border/50 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] font-extrabold uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-border/60">
                      {formattedDate}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">{g.categoria}</span>
                      <span className="text-[10px] text-slate-400 block -mt-0.5">{g.descricao || "Sem observação"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-extrabold text-accent-success">
                      + R$ {g.valor.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="text-slate-500 hover:text-accent-danger p-1 rounded transition-colors"
                      title="Apagar corre"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
