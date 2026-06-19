// ============================================================================
//  Configuração de PRESTADORAS e REGRAS DE SUGESTÃO
//
//  Edite este arquivo para incluir as prestadoras (empresas que recebem as OS)
//  e as regras de "qual prestadora sugerir" de acordo com a CIDADE + TIPO de OS.
//  Após editar, basta publicar novamente (o GitHub Actions faz o deploy).
// ============================================================================

export type Prestadora = {
  /** Identificador único e estável (use em REGRAS e no perfil do usuário EMPRESA). */
  id: string;
  nome: string;
};

export type RegraSugestao = {
  /** Cidade atendida. Comparação sem acento e sem diferenciar maiúsculas. */
  cidade: string;
  /** Tipo de OS. Deixe ausente/"*" para valer para qualquer tipo na cidade. */
  tipo?: string;
  /** Id da prestadora sugerida. */
  prestadoraId: string;
};

// ---------------------------------------------------------------------------
//  Tipos de OS disponíveis no formulário
// ---------------------------------------------------------------------------
export const TIPOS_OS: string[] = [
  "Instalação",
  "Manutenção",
  "Reparo",
  "Vistoria",
  "Retirada",
];

// ---------------------------------------------------------------------------
//  Prestadoras (exemplos — substitua pelos reais)
// ---------------------------------------------------------------------------
export const PRESTADORAS: Prestadora[] = [
  { id: "prest-norte", nome: "Prestadora Norte" },
  { id: "prest-sul", nome: "Prestadora Sul" },
  { id: "prest-central", nome: "Prestadora Central" },
];

// ---------------------------------------------------------------------------
//  Regras de sugestão (exemplos — substitua pelos reais)
//  A primeira regra que casar cidade + tipo vence; se não houver, tenta uma
//  regra só por cidade (tipo "*").
// ---------------------------------------------------------------------------
export const REGRAS_SUGESTAO: RegraSugestao[] = [
  { cidade: "São Paulo", tipo: "Instalação", prestadoraId: "prest-central" },
  { cidade: "São Paulo", prestadoraId: "prest-central" },
  { cidade: "Campinas", prestadoraId: "prest-sul" },
  { cidade: "Manaus", prestadoraId: "prest-norte" },
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

/**
 * Sugere a prestadora para uma cidade + tipo de OS, conforme REGRAS_SUGESTAO.
 * Retorna o id da prestadora ou null se nenhuma regra casar.
 */
export function sugerirPrestadora(
  cidade: string,
  tipo: string
): string | null {
  const c = normalize(cidade);
  const t = normalize(tipo);
  if (!c) return null;

  // 1) Regra específica de cidade + tipo
  const exata = REGRAS_SUGESTAO.find(
    (r) => normalize(r.cidade) === c && r.tipo && normalize(r.tipo) === t
  );
  if (exata) return exata.prestadoraId;

  // 2) Regra coringa de cidade (sem tipo ou tipo "*")
  const coringa = REGRAS_SUGESTAO.find(
    (r) => normalize(r.cidade) === c && (!r.tipo || r.tipo === "*")
  );
  return coringa?.prestadoraId ?? null;
}
