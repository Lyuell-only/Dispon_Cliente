// ============================================================================
//  Configuração de PRESTADORAS, CIDADES, CATEGORIAS/TIPOS e REGRAS DE SUGESTÃO
//
//  Edite este arquivo para manter os dados. Após editar, basta publicar (o
//  GitHub Actions builda e publica automaticamente).
// ============================================================================

export type Prestadora = {
  /** Identificador único e estável (usado nas regras e no perfil da EMPRESA). */
  id: string;
  nome: string;
};

export type Categoria = {
  nome: string;
  tipos: string[];
};

export type RegraSugestao = {
  cidade: string;
  /** Categoria da OS: "Ativação", "Manutenção", etc. */
  categoria: string;
  /** Prestadoras sugeridas (a primeira é a preferida; as demais ficam como alternativa). */
  prestadoraIds: string[];
};

// ---------------------------------------------------------------------------
//  Prestadoras (empresas que recebem as OS)
// ---------------------------------------------------------------------------
export const PRESTADORAS: Prestadora[] = [
  { id: "fabio", nome: "Fabio Telecom" },
  { id: "gm", nome: "GM Serviços" },
  { id: "future", nome: "Future Telecom" },
  { id: "vb", nome: "VB Instalações" },
  { id: "fmat", nome: "FMAT Telecom" },
  { id: "vwm", nome: "VWM Telecom" },
  { id: "andrade", nome: "Andrade Telecom" },
  { id: "pap", nome: "PAP Serviços" },
  { id: "gleison", nome: "Gleison Telecom" },
];

// ---------------------------------------------------------------------------
//  Cidades atendidas
// ---------------------------------------------------------------------------
export const CIDADES: string[] = [
  "Igarapé",
  "São Joaquim de Bicas",
  "Betim",
  "Contagem",
  "Esmeraldas",
  "Mateus Leme",
  "Juatuba",
  "Itaúna",
  "Florestal",
  "Crucilândia",
  "Piracema",
  "Itaguara",
];

// ---------------------------------------------------------------------------
//  Categorias e tipos de OS
// ---------------------------------------------------------------------------
export const CATEGORIAS: Categoria[] = [
  {
    nome: "Ativação",
    tipos: ["Instalação", "Instalação PME", "Mudança de endereço"],
  },
  {
    nome: "Manutenção",
    tipos: [
      "Suporte",
      "Suporte Retenção",
      "Suporte Especializado",
      "Suporte Garantia",
    ],
  },
  {
    nome: "Agregados",
    tipos: ["Ponto de rede", "Ativação STFC", "Mudança de cômodo", "Upgrade"],
  },
  {
    nome: "Outros",
    tipos: ["Outro"],
  },
];

// ---------------------------------------------------------------------------
//  Regras de sugestão (cidade + categoria -> prestadoras)
//  Categorias "Agregados" e "Outros" não têm regra -> sem sugestão automática.
// ---------------------------------------------------------------------------
export const REGRAS_SUGESTAO: RegraSugestao[] = [
  { cidade: "Igarapé", categoria: "Ativação", prestadoraIds: ["gleison", "future"] },
  { cidade: "Igarapé", categoria: "Manutenção", prestadoraIds: ["gm"] },

  { cidade: "São Joaquim de Bicas", categoria: "Ativação", prestadoraIds: ["andrade"] },
  { cidade: "São Joaquim de Bicas", categoria: "Manutenção", prestadoraIds: ["fmat"] },

  { cidade: "Betim", categoria: "Ativação", prestadoraIds: ["gm"] },
  { cidade: "Betim", categoria: "Manutenção", prestadoraIds: ["vb"] },

  { cidade: "Contagem", categoria: "Ativação", prestadoraIds: ["gm"] },
  { cidade: "Contagem", categoria: "Manutenção", prestadoraIds: ["vb"] },

  { cidade: "Esmeraldas", categoria: "Ativação", prestadoraIds: ["gm"] },
  { cidade: "Esmeraldas", categoria: "Manutenção", prestadoraIds: ["vb"] },

  { cidade: "Mateus Leme", categoria: "Ativação", prestadoraIds: ["vwm"] },
  { cidade: "Mateus Leme", categoria: "Manutenção", prestadoraIds: ["gm"] },

  { cidade: "Juatuba", categoria: "Ativação", prestadoraIds: ["vwm"] },
  { cidade: "Juatuba", categoria: "Manutenção", prestadoraIds: ["gm"] },

  { cidade: "Florestal", categoria: "Ativação", prestadoraIds: ["vwm"] },
  { cidade: "Florestal", categoria: "Manutenção", prestadoraIds: ["gm"] },

  { cidade: "Itaúna", categoria: "Ativação", prestadoraIds: ["gm"] },
  { cidade: "Itaúna", categoria: "Manutenção", prestadoraIds: ["gm"] },

  { cidade: "Crucilândia", categoria: "Ativação", prestadoraIds: ["fabio"] },
  { cidade: "Crucilândia", categoria: "Manutenção", prestadoraIds: ["fabio"] },

  { cidade: "Piracema", categoria: "Ativação", prestadoraIds: ["fabio"] },
  { cidade: "Piracema", categoria: "Manutenção", prestadoraIds: ["fabio"] },

  { cidade: "Itaguara", categoria: "Ativação", prestadoraIds: ["fabio"] },
  { cidade: "Itaguara", categoria: "Manutenção", prestadoraIds: ["fabio"] },
];

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function prestadoraNome(id: string | null | undefined): string {
  if (!id) return "—";
  return PRESTADORAS.find((p) => p.id === id)?.nome ?? id;
}

/** Descobre a categoria a partir de um tipo de OS (ou null se não encontrar). */
export function categoriaDoTipo(tipo: string | null | undefined): string | null {
  if (!tipo) return null;
  const t = normalize(tipo);
  return CATEGORIAS.find((c) => c.tipos.some((x) => normalize(x) === t))?.nome ?? null;
}

/**
 * Sugere prestadoras para uma cidade + categoria (a primeira é a preferida).
 * Retorna lista vazia se não houver regra.
 */
export function sugerirPrestadoras(cidade: string, categoria: string): string[] {
  const c = normalize(cidade);
  const cat = normalize(categoria);
  if (!c || !cat) return [];
  return (
    REGRAS_SUGESTAO.find(
      (r) => normalize(r.cidade) === c && normalize(r.categoria) === cat
    )?.prestadoraIds ?? []
  );
}
