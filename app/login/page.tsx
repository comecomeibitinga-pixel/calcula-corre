"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { ArrowLeft, Lock, Mail, UserPlus, LogIn, CheckCircle, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [sucessoMsg, setSucessoMsg] = useState("");

  useEffect(() => {
    // Se o Supabase não estiver configurado no env, avisa o usuário
    if (!isSupabaseConfigured) {
      setErrorMsg("O Supabase não está configurado. Cadastre as chaves no arquivo .env.local para liberar o login na nuvem.");
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) return;

    setLoading(true);
    setErrorMsg("");
    setSucessoMsg("");

    try {
      if (isLogin) {
        // LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setSucessoMsg("Login efetuado com sucesso! Redirecionando...");
        setTimeout(() => {
          router.push("/");
          // Atualiza o header e dashboard
          window.dispatchEvent(new Event("profile-updated"));
        }, 1500);
      } else {
        // CADASTRO
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;

        // Se o email não precisar de confirmação no console do Supabase
        if (data.session) {
          setSucessoMsg("Conta criada com sucesso! Entrando...");
          setTimeout(() => {
            router.push("/");
            window.dispatchEvent(new Event("profile-updated"));
          }, 1500);
        } else {
          setSucessoMsg("Cadastro efetuado! Verifique seu email para confirmar a conta.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Ocorreu um erro na autenticação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-sm mx-auto py-8">
      {/* Back to home */}
      <div>
        <Link href="/" className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-all">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </Link>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">
          {isLogin ? "Acessar CalculaCorre" : "Criar sua Conta"}
        </h2>
        <p className="text-xs text-slate-400">
          {isLogin 
            ? "Entre para salvar seus corre na nuvem" 
            : "Guarde seus dados e acesse de qualquer celular"}
        </p>
      </div>

      {/* Auth Box */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xl space-y-4">
        {errorMsg && (
          <div className="bg-accent-danger/10 border border-accent-danger/20 p-3 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 text-accent-danger shrink-0 mt-0.5" />
            <span className="text-[10px] text-slate-300 font-semibold leading-tight">{errorMsg}</span>
          </div>
        )}

        {sucessoMsg && (
          <div className="bg-accent-success/15 border border-accent-success/20 p-3 rounded-xl flex items-start gap-2.5">
            <CheckCircle className="w-4.5 h-4.5 text-accent-success shrink-0 mt-0.5" />
            <span className="text-[10px] text-green-400 font-semibold leading-tight">{sucessoMsg}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {/* Email input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                disabled={!isSupabaseConfigured || loading}
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-border rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent-primary transition-all font-semibold"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                disabled={!isSupabaseConfigured || loading}
                placeholder="Sua senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-border rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent-primary transition-all font-semibold"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isSupabaseConfigured || loading}
            className="w-full py-3 bg-accent-primary hover:bg-yellow-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {loading ? "Processando..." : isLogin ? "Entrar na Conta" : "Criar Minha Conta"}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center pt-2 border-t border-border/60">
          <button
            type="button"
            disabled={loading || !isSupabaseConfigured}
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg("");
              setSucessoMsg("");
            }}
            className="text-[10px] font-bold text-accent-primary hover:underline"
          >
            {isLogin ? "Ainda não tem conta? Cadastre-se grátis" : "Já possui conta? Faça o login"}
          </button>
        </div>
      </div>

      {/* Guest Mode Option */}
      <div className="text-center">
        <Link
          href="/"
          className="text-[10px] text-slate-400 hover:text-slate-300 font-bold hover:underline"
        >
          Continuar no Modo Offline (Dados locais no aparelho)
        </Link>
      </div>
    </div>
  );
}
