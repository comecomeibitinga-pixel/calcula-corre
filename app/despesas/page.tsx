"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, Despesa, Profile } from "@/lib/db";
import { ArrowLeft, Trash2, ShieldAlert, Fuel, Wrench, Coins, Calendar, FileText, TrendingDown } from "lucide-react";

type TipoDespesa = "Combustível" | "Manutenção" | "Outros";
type CatManutencao = "Óleo" | "Relação" | "Pneu" | "Outro";

export default function DespesasPage() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // Form States
  const [tipo, setTipo] = useState<TipoDespesa>("Combustível");
  const [valor, setValor] = useState("");
  const [kmRegistro, setKmRegistro] = useState("");
  const [litros, setLitros] = useState("");
  const [categoriaManutencao, setCategoriaManutencao] = useState<CatManutencao>("Óleo");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const loadData = async () => {
    try {
      const list = await db.getDespesas();
      const p = await db.getProfile();
      setDespesas(list);
      setProfile(p);
      // Auto-preencher o KM atual para poupar digitação
      if (p) {
        setKmRegistro(p.km_atual.toString());
      }
    } catch (err) {
      console.error("Erro ao carregar despesas", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor || parseFloat(valor) <= 0) return;

    setSalvando(true);
    try {
      const parsedValor = parseFloat(parseFloat(valor).toFixed(2));
      const parsedKm = kmRegistro ? parseInt(kmRegistro) : undefined;
      const parsedLitros = litros ? parseFloat(parseFloat(litros).toFixed(2)) : undefined;

      let descFinal = descricao.trim();
      if (!descFinal) {
        if (tipo === "Combustível") {
          descFinal = parsedLitros ? `Combustível (${parsedLitros}L)` : "Combustível";
        } else if (tipo === "Manutenção") {
          descFinal = `Manutenção: ${categoriaManutencao}`;
        } else {
          descFinal = "Outros gastos";
        }
      }

      await db.addDespesa({
        tipo,
        valor: parsedValor,
        km_registro: parsedKm,
        litros: parsedLitros,
        categoria_manutencao: tipo === "Manutenção" ? categoriaManutencao : undefined,
        descricao: descFinal,
        data,
      });

      // Reset
      setValor("");
      setLitros("");
      setDescricao("");
      setSucesso(true);
      setTimeout(() => setSucesso(false), 2000);
      
      // Reload
      await loadData();
      
      // Trigger header update
      window.dispatchEvent(new Event("profile-updated"));
    } catch (err) {
      console.error("Erro ao salvar despesa", err);
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Quer mesmo excluir esta despesa?")) {
      try {
        await db.deleteDespesa(id);
        await loadData();
        window.dispatchEvent(new Event("profile-updated"));
      } catch (err: any) {
        console.error("Erro ao deletar despesa:", err);
        alert("Erro ao excluir. Se você estiver logado, verifique a conexão ou as políticas de segurança (RLS) no Supabase.");
      }
    }
  };

  const totalHoje = despesas
    .filter((d) => d.data === new Date().toISOString().split("T")[0])
    .reduce((sum, d) => sum + d.valor, 0);

  return (
    <div className="space-y-6">
      {/* Back button and title */}
      <div className="flex items-center justify-between">
        <Link href="/" className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-all">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <span className="text-xs font-bold text-accent-danger bg-accent-danger/15 px-3 py-1 rounded-full">
          Hoje: R$ {totalHoje.toFixed(2)}
        </span>
      </div>

      <div>
        <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
          <TrendingDown className="w-6 h-6 text-accent-danger" /> Registrar Despesas
        </h2>
        <p className="text-xs text-slate-400 mt-1">Insira gastos com gasolina, óleo ou peças da moto.</p>
      </div>

      {/* Form Tabs */}
      <div className="flex border border-border rounded-xl overflow-hidden p-0.5 bg-slate-900/60 select-none">
        {(["Combustível", "Manutenção", "Outros"] as TipoDespesa[]).map((t) => {
          const active = tipo === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTipo(t);
                // Pre-fill default descriptions or reset
                setDescricao("");
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                active 
                  ? "bg-card text-accent-danger border border-border/80 shadow-md font-extrabold" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t === "Combustível" && <Fuel className="w-4 h-4" />}
              {t === "Manutenção" && <Wrench className="w-4 h-4" />}
              {t === "Outros" && <Coins className="w-4 h-4" />}
              {t}
            </button>
          );
        })}
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-5 shadow-lg space-y-4">
        
        {/* Value field */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor Gasto</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
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
              className="w-full bg-slate-900 border border-border rounded-xl py-3 pl-10 pr-4 text-lg font-black text-slate-100 placeholder-slate-600 focus:outline-none focus:border-accent-danger focus:ring-1 focus:ring-accent-danger/30 transition-all"
            />
          </div>
        </div>

        {/* Dynamic Fields for COMBUSÍVEL */}
        {tipo === "Combustível" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">KM Atual da Moto</label>
              <input
                type="number"
                inputMode="numeric"
                required
                placeholder={profile ? profile.km_atual.toString() : "Ex: 12500"}
                value={kmRegistro}
                onChange={(e) => setKmRegistro(e.target.value)}
                className="w-full bg-slate-900 border border-border rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-accent-danger transition-all font-bold"
              />
              {profile && kmRegistro && parseInt(kmRegistro) < profile.km_atual && (
                <span className="text-[9px] text-accent-danger block font-semibold">
                  ⚠️ Menor que KM atual ({profile.km_atual})
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Litros (Média)</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="Ex: 8.50"
                value={litros}
                onChange={(e) => setLitros(e.target.value)}
                className="w-full bg-slate-900 border border-border rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-accent-danger transition-all font-bold"
              />
            </div>
          </div>
        )}

        {/* Dynamic Fields for MANUTENÇÃO */}
        {tipo === "Manutenção" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Peça / Categoria</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(["Óleo", "Relação", "Pneu", "Outro"] as CatManutencao[]).map((cat) => {
                  const active = categoriaManutencao === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoriaManutencao(cat)}
                      className={`py-2 rounded-lg border text-[10px] font-extrabold text-center transition-all ${
                        active 
                          ? "bg-accent-danger text-white border-accent-danger shadow-sm" 
                          : "bg-slate-900/60 text-slate-400 border-border/80 hover:text-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">KM Registrado no Painel</label>
              <input
                type="number"
                inputMode="numeric"
                required
                placeholder={profile ? profile.km_atual.toString() : "Ex: 12500"}
                value={kmRegistro}
                onChange={(e) => setKmRegistro(e.target.value)}
                className="w-full bg-slate-900 border border-border rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-accent-danger transition-all font-bold"
              />
              {categoriaManutencao === "Óleo" && (
                <span className="text-[9px] text-accent-warning block font-semibold">
                  💡 Isso definirá o início da nova contagem para a troca de óleo!
                </span>
              )}
            </div>
          </div>
        )}

        {/* Common metadata fields */}
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
              className="w-full bg-slate-900/60 border border-border rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-accent-danger transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" /> Descrição
            </label>
            <input
              type="text"
              placeholder={tipo === "Combustível" ? "Gasolina comum" : "Posto ou mecânica"}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full bg-slate-900/60 border border-border rounded-xl py-2 px-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent-danger transition-all"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={salvando}
          className={`w-full py-4 rounded-xl font-black uppercase text-sm tracking-wider shadow-lg active:scale-[0.98] transition-all duration-150 select-none ${
            sucesso 
              ? "bg-accent-danger text-white font-bold" 
              : "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-400 hover:to-rose-500"
          }`}
        >
          {salvando ? "Salvando..." : sucesso ? "✓ Lançado com Sucesso!" : "Lançar Despesa 💸"}
        </button>
      </form>

      {/* History log */}
      <section className="bg-card border border-border rounded-2xl p-4 shadow-md">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Histórico de Gastos</h3>
        
        {despesas.length === 0 ? (
          <p className="text-center py-6 text-xs text-slate-500">Nenhum gasto registrado.</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {despesas.map((d) => {
              const formattedDate = new Date(d.data + "T12:00:00").toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
              });
              
              return (
                <div key={d.id} className="flex justify-between items-center bg-slate-900/40 border border-border/50 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] font-extrabold uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-border/60">
                      {formattedDate}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">{d.tipo}</span>
                      <span className="text-[10px] text-slate-400 block -mt-0.5">
                        {d.descricao} {d.km_registro && `• ${d.km_registro} km`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-extrabold text-accent-danger">
                      - R$ {d.valor.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="text-slate-500 hover:text-accent-danger p-1 rounded transition-colors"
                      title="Apagar despesa"
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
