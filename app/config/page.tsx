"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, Profile } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { ArrowLeft, Settings, Save, Sliders, Database, AlertTriangle, RefreshCw, LogIn, LogOut, Download, Heart, Copy, Check } from "lucide-react";

export default function ConfigPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Fields
  const [metaDiaria, setMetaDiaria] = useState("");
  const [kmAtual, setKmAtual] = useState("");
  const [trocaOleoIntervalo, setTrocaOleoIntervalo] = useState("");
  const [ultimaTrocaOleoKm, setUltimaTrocaOleoKm] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const pixKey = process.env.NEXT_PUBLIC_DEVELOPER_PIX_KEY || "seu-pix@email.com";

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      const p = await db.getProfile();
      setProfile(p);
      setMetaDiaria(p.meta_diaria.toString());
      setKmAtual(p.km_atual.toString());
      setTrocaOleoIntervalo(p.troca_oleo_intervalo.toString());
      setUltimaTrocaOleoKm(p.ultima_troca_oleo_km.toString());

      // Obter email da sessão caso Supabase esteja configurado
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        setUserEmail(data.session?.user?.email || null);
      }
    } catch (err) {
      console.error("Erro ao carregar configurações", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleExportGanhosCSV = async () => {
    try {
      const list = await db.getGanhos();
      if (list.length === 0) {
        alert("Não há ganhos cadastrados para exportar.");
        return;
      }
      const headers = ["ID", "Data", "Categoria", "Valor", "Descricao"];
      const rows = list.map(g => [
        g.id,
        g.data,
        g.categoria,
        g.valor.toFixed(2),
        `"${(g.descricao || "").replace(/"/g, '""')}"`
      ]);
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ganhos_calculacorre_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Erro ao exportar ganhos:", err);
      alert("Erro ao exportar dados.");
    }
  };

  const handleExportDespesasCSV = async () => {
    try {
      const list = await db.getDespesas();
      if (list.length === 0) {
        alert("Não há despesas cadastradas para exportar.");
        return;
      }
      const headers = ["ID", "Data", "Tipo", "Categoria Manutencao", "Valor", "KM Registro", "Litros", "Descricao"];
      const rows = list.map(d => [
        d.id,
        d.data,
        d.tipo,
        d.categoria_manutencao || "",
        d.valor.toFixed(2),
        d.km_registro || "",
        d.litros || "",
        `"${(d.descricao || "").replace(/"/g, '""')}"`
      ]);
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `despesas_calculacorre_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Erro ao exportar despesas:", err);
      alert("Erro ao exportar dados.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSalvando(true);
    try {
      const updated = await db.updateProfile({
        meta_diaria: parseFloat(metaDiaria) || 150,
        km_atual: parseInt(kmAtual) || 0,
        troca_oleo_intervalo: parseInt(trocaOleoIntervalo) || 1000,
        ultima_troca_oleo_km: parseInt(ultimaTrocaOleoKm) || 0,
      });
      setProfile(updated);
      setSucesso(true);
      setTimeout(() => setSucesso(false), 2000);
      
      // Dispatch custom event to notify Header of data changes
      window.dispatchEvent(new Event("profile-updated"));
    } catch (err) {
      console.error("Erro ao atualizar configurações", err);
    } finally {
      setSalvando(false);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      if (confirm("Quer mesmo sair da sua conta?")) {
        await supabase.auth.signOut();
        setUserEmail(null);
        window.dispatchEvent(new Event("profile-updated"));
        loadProfile();
      }
    }
  };

  const handleResetLocalStorage = () => {
    if (
      confirm(
        "Tem certeza que deseja redefinir o aplicativo? Todos os ganhos e despesas inseridos localmente serão apagados!"
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium text-sm">Carregando seus ajustes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link href="/" className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-all">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-accent-primary" /> Configurações
        </h2>
        <p className="text-xs text-slate-400 mt-1">Configure suas metas financeiras e alertas da sua moto.</p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-card border border-border rounded-2xl p-5 shadow-lg space-y-4">
        
        {/* Meta Diária */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Meta de Faturamento Diário (R$)</label>
          <input
            type="number"
            inputMode="decimal"
            required
            value={metaDiaria}
            onChange={(e) => setMetaDiaria(e.target.value)}
            className="w-full bg-slate-900 border border-border rounded-xl py-2.5 px-3.5 text-sm text-slate-100 font-bold focus:outline-none focus:border-accent-primary transition-all"
          />
        </div>

        {/* KM Atual */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quilometragem Atual (Odomêtro)</label>
          <input
            type="number"
            inputMode="numeric"
            required
            value={kmAtual}
            onChange={(e) => setKmAtual(e.target.value)}
            className="w-full bg-slate-900 border border-border rounded-xl py-2.5 px-3.5 text-sm text-slate-100 font-bold focus:outline-none focus:border-accent-primary transition-all"
          />
        </div>

        {/* Intervalo Troca de Óleo */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trocar Óleo a Cada (km)</label>
          <input
            type="number"
            inputMode="numeric"
            required
            value={trocaOleoIntervalo}
            onChange={(e) => setTrocaOleoIntervalo(e.target.value)}
            className="w-full bg-slate-900 border border-border rounded-xl py-2.5 px-3.5 text-sm text-slate-100 font-bold focus:outline-none focus:border-accent-primary transition-all"
          />
          <span className="text-[9px] text-slate-400 block -mt-0.5">Padrão da maioria das motos é 1.000 km</span>
        </div>

        {/* Última Troca de Óleo */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">KM da Última Troca de Óleo</label>
          <input
            type="number"
            inputMode="numeric"
            required
            value={ultimaTrocaOleoKm}
            onChange={(e) => setUltimaTrocaOleoKm(e.target.value)}
            className="w-full bg-slate-900 border border-border rounded-xl py-2.5 px-3.5 text-sm text-slate-100 font-bold focus:outline-none focus:border-accent-primary transition-all"
          />
          {parseInt(ultimaTrocaOleoKm) > parseInt(kmAtual) && (
            <span className="text-[9px] text-accent-danger block font-semibold">
              ⚠️ O KM da última troca não pode ser maior que o KM atual da moto.
            </span>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={salvando || (parseInt(ultimaTrocaOleoKm) > parseInt(kmAtual))}
          className={`w-full py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all duration-150 select-none ${
            sucesso 
              ? "bg-accent-success text-slate-950" 
              : "bg-accent-primary text-slate-950 hover:bg-yellow-400"
          }`}
        >
          <Save className="w-4 h-4" />
          {salvando ? "Salvando..." : sucesso ? "✓ Configurações Salvas!" : "Salvar Configurações"}
        </button>
      </form>

      {/* Database connection inspector */}
      <section className="bg-card border border-border rounded-2xl p-4 shadow-md space-y-3">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Database className="w-4 h-4 text-accent-info" /> Conexão de Dados
        </h3>

        {isSupabaseConfigured ? (
          userEmail ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 bg-green-500/10 border border-green-500/25 p-3 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></span>
                <div>
                  <span className="text-xs font-bold text-green-400 block">Sincronizado na Nuvem</span>
                  <span className="text-[9px] text-slate-400 block -mt-0.5">
                    Conectado como: <strong className="text-slate-200">{userEmail}</strong>
                  </span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-border text-slate-300 hover:text-white text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                Desconectar Conta (Sair)
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl">
                <AlertTriangle className="w-4.5 h-4.5 text-accent-warning shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-accent-warning block">Modo Local (Offline)</span>
                  <span className="text-[9px] text-slate-300 block leading-tight mt-0.5">
                    O banco de dados na nuvem está disponível, mas você não está logado. Seus lançamentos estão salvos apenas neste celular.
                  </span>
                </div>
              </div>

              <Link
                href="/login"
                className="w-full py-3 bg-accent-primary hover:bg-yellow-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md"
              >
                <LogIn className="w-4 h-4" />
                Entrar / Criar Conta para Sincronizar
              </Link>
            </div>
          )
        ) : (
          <div className="space-y-2">
            <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/25 p-3 rounded-xl">
              <AlertTriangle className="w-4.5 h-4.5 text-accent-warning shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-accent-warning block">Sem Nuvem Configurada</span>
                <span className="text-[9px] text-slate-300 block leading-tight mt-0.5">
                  Nenhuma chave do Supabase foi configurada no arquivo <code className="bg-slate-900 px-1 rounded">.env.local</code>. Seus dados estão salvos apenas no seu navegador.
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/40 border border-border/60 rounded-xl">
              <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Como integrar a nuvem Supabase:</span>
              <p className="text-[9px] text-slate-400 leading-normal">
                Crie um arquivo <code className="text-accent-warning">.env.local</code> na raiz do projeto e configure as chaves:<br />
                <code className="text-slate-300">NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui</code><br />
                <code className="text-slate-300">NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui</code>
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Portabilidade de Dados */}
      <section className="bg-card border border-border rounded-2xl p-4 shadow-md space-y-3">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Download className="w-4 h-4 text-accent-success" /> Exportar Dados (CSV)
        </h3>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Baixe o histórico completo em arquivos compatíveis com Excel e Planilhas Google.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleExportGanhosCSV}
            className="py-2.5 bg-slate-900 hover:bg-slate-800 border border-border hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-accent-success" />
            Ganhos.csv
          </button>
          <button
            type="button"
            onClick={handleExportDespesasCSV}
            className="py-2.5 bg-slate-900 hover:bg-slate-800 border border-border hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-accent-danger" />
            Despesas.csv
          </button>
        </div>
      </section>

      {/* Apoie o CalculaCorre */}
      <section className="bg-card border border-border rounded-2xl p-4 shadow-md space-y-3 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-10 -top-10 w-24 h-24 bg-accent-primary/10 rounded-full blur-xl pointer-events-none" />
        
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500/10 animate-pulse" /> Apoie o Projeto
        </h3>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Gostou do CalculaCorre? Faça uma doação voluntária de qualquer valor via Pix para apoiar novas atualizações e manter o servidor no ar!
        </p>

        <div className="bg-slate-900 border border-border/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
          <div className="overflow-hidden">
            <span className="text-[8px] text-slate-500 uppercase font-bold block">Chave Pix</span>
            <span className="text-xs text-slate-200 font-mono block truncate select-all">
              {pixKey}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyPix}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1 shrink-0 ${
              copiado 
                ? "bg-accent-success/20 text-accent-success border border-accent-success/30" 
                : "bg-accent-primary hover:bg-yellow-400 text-slate-950"
            }`}
          >
            {copiado ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copiar
              </>
            )}
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-card border border-accent-danger/20 rounded-2xl p-4 shadow-md space-y-3">
        <h3 className="text-[11px] font-bold text-accent-danger uppercase tracking-wider">Zona de Perigo</h3>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          As ações abaixo são destrutivas e reiniciarão os dados salvos localmente no seu dispositivo.
        </p>

        <button
          onClick={handleResetLocalStorage}
          className="w-full py-2.5 bg-accent-danger/10 hover:bg-accent-danger/20 border border-accent-danger/25 hover:border-accent-danger/45 text-accent-danger text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          Redefinir Dados Locais
        </button>
      </section>
    </div>
  );
}
