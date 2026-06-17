import { supabase, isSupabaseConfigured } from "./supabase";

export interface Profile {
  id: string;
  meta_diaria: number;
  km_atual: number;
  troca_oleo_intervalo: number;
  ultima_troca_oleo_km: number;
  created_at?: string;
}

export interface Ganho {
  id: string;
  user_id: string;
  valor: number;
  categoria: "iFood" | "Uber" | "Lanchonete Fixa" | "Particular";
  descricao?: string;
  data: string; // YYYY-MM-DD
  created_at?: string;
}

export interface Despesa {
  id: string;
  user_id: string;
  tipo: "Combustível" | "Manutenção" | "Outros";
  categoria_manutencao?: "Óleo" | "Relação" | "Pneu" | "Outro";
  valor: number;
  km_registro?: number;
  litros?: number;
  descricao?: string;
  data: string; // YYYY-MM-DD
  created_at?: string;
}

// Helpers for Mock Data
const MOCK_USER_ID = "mock-motoboy-123";

const getLocalDateString = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - offsetDays);
  return date.toISOString().split("T")[0];
};

const getInitialMockProfile = (): Profile => ({
  id: MOCK_USER_ID,
  meta_diaria: 150.0,
  km_atual: 12780,
  troca_oleo_intervalo: 1000,
  ultima_troca_oleo_km: 12000,
});

const getInitialMockGanhos = (): Ganho[] => [
  {
    id: "g-1",
    user_id: MOCK_USER_ID,
    valor: 85.5,
    categoria: "iFood",
    descricao: "Almoço no centro",
    data: getLocalDateString(0),
  },
  {
    id: "g-2",
    user_id: MOCK_USER_ID,
    valor: 62.0,
    categoria: "Uber",
    descricao: "Giro da tarde",
    data: getLocalDateString(0),
  },
  {
    id: "g-3",
    user_id: MOCK_USER_ID,
    valor: 130.0,
    categoria: "Lanchonete Fixa",
    descricao: "Diária lanchonete",
    data: getLocalDateString(1),
  },
  {
    id: "g-4",
    user_id: MOCK_USER_ID,
    valor: 45.0,
    categoria: "Particular",
    descricao: "Entrega doc contabilidade",
    data: getLocalDateString(1),
  },
  {
    id: "g-5",
    user_id: MOCK_USER_ID,
    valor: 120.0,
    categoria: "iFood",
    descricao: "Corre chuvoso",
    data: getLocalDateString(3),
  },
  {
    id: "g-6",
    user_id: MOCK_USER_ID,
    valor: 95.0,
    categoria: "Uber",
    descricao: "Giro no shopping",
    data: getLocalDateString(4),
  },
];

const getInitialMockDespesas = (): Despesa[] => [
  {
    id: "d-1",
    user_id: MOCK_USER_ID,
    tipo: "Combustível",
    valor: 45.0,
    km_registro: 12610,
    litros: 8.0,
    descricao: "Gasolina comum Ipiranga",
    data: getLocalDateString(1),
  },
  {
    id: "d-2",
    user_id: MOCK_USER_ID,
    tipo: "Combustível",
    valor: 42.5,
    km_registro: 12380,
    litros: 7.8,
    descricao: "Gasolina Shell V-Power",
    data: getLocalDateString(4),
  },
  {
    id: "d-3",
    user_id: MOCK_USER_ID,
    tipo: "Manutenção",
    categoria_manutencao: "Óleo",
    valor: 38.0,
    km_registro: 12000,
    descricao: "Troca de óleo Mobil 20w50",
    data: getLocalDateString(5),
  },
];

// LocalStorage Handlers
const getLocalData = <T>(key: string, initialData: T): T => {
  if (typeof window === "undefined") return initialData;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(data);
};

const setLocalData = <T>(key: string, data: T): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

// Helper to get authenticated user
async function getAuthUser() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.user || null;
    } catch {
      return null;
    }
  }
  return null;
}

// Database Operations
export const db = {
  // --- PROFILE ---
  async getProfile(): Promise<Profile> {
    const user = await getAuthUser();
    if (user && supabase) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        // Create profile if not exists in cloud
        const newProfile = {
          id: user.id,
          meta_diaria: 150.0,
          km_atual: 0,
          troca_oleo_intervalo: 1000,
          ultima_troca_oleo_km: 0,
        };
        await supabase.from("profiles").insert(newProfile);
        return newProfile;
      }
      return data as Profile;
    } else {
      return getLocalData("calculacorre_profile", getInitialMockProfile());
    }
  },

  async updateProfile(profile: Partial<Profile>): Promise<Profile> {
    const user = await getAuthUser();
    if (user && supabase) {
      const { data, error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    } else {
      const current = getLocalData("calculacorre_profile", getInitialMockProfile());
      const updated = { ...current, ...profile };
      setLocalData("calculacorre_profile", updated);
      return updated;
    }
  },

  // --- GANHOS ---
  async getGanhos(): Promise<Ganho[]> {
    const user = await getAuthUser();
    if (user && supabase) {
      const { data, error } = await supabase
        .from("ganhos")
        .select("*")
        .order("data", { ascending: false });

      if (error) throw error;
      return data as Ganho[];
    } else {
      return getLocalData("calculacorre_ganhos", getInitialMockGanhos()).sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      );
    }
  },

  async addGanho(ganho: Omit<Ganho, "id" | "user_id" | "created_at">): Promise<Ganho> {
    const user = await getAuthUser();
    if (user && supabase) {
      const { data, error } = await supabase
        .from("ganhos")
        .insert({
          ...ganho,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Ganho;
    } else {
      const list = getLocalData("calculacorre_ganhos", getInitialMockGanhos());
      const newGanho: Ganho = {
        ...ganho,
        id: "g-" + Math.random().toString(36).substr(2, 9),
        user_id: MOCK_USER_ID,
      };
      list.push(newGanho);
      setLocalData("calculacorre_ganhos", list);
      return newGanho;
    }
  },

  async deleteGanho(id: string): Promise<void> {
    const user = await getAuthUser();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isDbId = uuidRegex.test(id);

    if (user && supabase && isDbId) {
      const { error } = await supabase.from("ganhos").delete().eq("id", id);
      if (error) throw error;
    } else {
      const list = getLocalData("calculacorre_ganhos", getInitialMockGanhos());
      const filtered = list.filter((item) => item.id !== id);
      setLocalData("calculacorre_ganhos", filtered);
    }
  },

  // --- DESPESAS ---
  async getDespesas(): Promise<Despesa[]> {
    const user = await getAuthUser();
    if (user && supabase) {
      const { data, error } = await supabase
        .from("despesas")
        .select("*")
        .order("data", { ascending: false });

      if (error) throw error;
      return data as Despesa[];
    } else {
      return getLocalData("calculacorre_despesas", getInitialMockDespesas()).sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      );
    }
  },

  async addDespesa(
    despesa: Omit<Despesa, "id" | "user_id" | "created_at">
  ): Promise<Despesa> {
    const user = await getAuthUser();
    if (user && supabase) {
      const { data, error } = await supabase
        .from("despesas")
        .insert({
          ...despesa,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Se for combustível ou óleo, atualizar km_atual no perfil se km_registro for maior
      if (despesa.km_registro) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("km_atual")
          .eq("id", user.id)
          .single();

        if (profile && despesa.km_registro > profile.km_atual) {
          await supabase
            .from("profiles")
            .update({ km_atual: despesa.km_registro })
            .eq("id", user.id);
        }
      }

      return data as Despesa;
    } else {
      const list = getLocalData("calculacorre_despesas", getInitialMockDespesas());
      const newDespesa: Despesa = {
        ...despesa,
        id: "d-" + Math.random().toString(36).substr(2, 9),
        user_id: MOCK_USER_ID,
      };
      list.push(newDespesa);
      setLocalData("calculacorre_despesas", list);

      // Atualizar km_atual e se for óleo, atualizar ultima_troca_oleo_km
      if (despesa.km_registro) {
        const profile = getLocalData("calculacorre_profile", getInitialMockProfile());
        const updates: Partial<Profile> = {};

        if (despesa.km_registro > profile.km_atual) {
          updates.km_atual = despesa.km_registro;
        }

        if (despesa.tipo === "Manutenção" && despesa.categoria_manutencao === "Óleo") {
          updates.ultima_troca_oleo_km = despesa.km_registro;
        }

        if (Object.keys(updates).length > 0) {
          setLocalData("calculacorre_profile", { ...profile, ...updates });
        }
      }

      return newDespesa;
    }
  },

  async deleteDespesa(id: string): Promise<void> {
    const user = await getAuthUser();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isDbId = uuidRegex.test(id);

    if (user && supabase && isDbId) {
      const { error } = await supabase.from("despesas").delete().eq("id", id);
      if (error) throw error;
    } else {
      const list = getLocalData("calculacorre_despesas", getInitialMockDespesas());
      const filtered = list.filter((item) => item.id !== id);
      setLocalData("calculacorre_despesas", filtered);
    }
  },
};

// Média de Combustível Calculation Helper
export const calcularMediaCombustivel = (despesas: Despesa[]): { kmPorLitro: number; totalKm: number; totalLitros: number } => {
  const combustiveis = despesas
    .filter((d) => d.tipo === "Combustível" && d.km_registro && d.litros)
    .sort((a, b) => (a.km_registro || 0) - (b.km_registro || 0));

  if (combustiveis.length < 2) {
    return { kmPorLitro: 0, totalKm: 0, totalLitros: 0 };
  }

  let totalKm = 0;
  let totalLitros = 0;

  for (let i = 1; i < combustiveis.length; i++) {
    const atual = combustiveis[i];
    const anterior = combustiveis[i - 1];
    
    const kmPercorrido = (atual.km_registro || 0) - (anterior.km_registro || 0);
    const litrosConsumidos = atual.litros || 0;

    if (kmPercorrido > 0 && litrosConsumidos > 0) {
      totalKm += kmPercorrido;
      totalLitros += litrosConsumidos;
    }
  }

  const kmPorLitro = totalLitros > 0 ? parseFloat((totalKm / totalLitros).toFixed(2)) : 0;

  return { kmPorLitro, totalKm, totalLitros };
};
