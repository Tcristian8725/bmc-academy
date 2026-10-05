/** Estados (UF) e regiões do Brasil — usado no cadastro de endereço e no
 * relatório por região (Admin > Regiões, rodada 40). */
export const UF_REGION: Record<string, string> = {
  AC: "Norte",
  AP: "Norte",
  AM: "Norte",
  PA: "Norte",
  RO: "Norte",
  RR: "Norte",
  TO: "Norte",
  AL: "Nordeste",
  BA: "Nordeste",
  CE: "Nordeste",
  MA: "Nordeste",
  PB: "Nordeste",
  PE: "Nordeste",
  PI: "Nordeste",
  RN: "Nordeste",
  SE: "Nordeste",
  DF: "Centro-Oeste",
  GO: "Centro-Oeste",
  MT: "Centro-Oeste",
  MS: "Centro-Oeste",
  ES: "Sudeste",
  MG: "Sudeste",
  RJ: "Sudeste",
  SP: "Sudeste",
  PR: "Sul",
  RS: "Sul",
  SC: "Sul",
};

export const UFS = Object.keys(UF_REGION).sort();
export const REGIONS = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"] as const;
export const NO_REGION = "Sem endereço informado";

/** Normaliza a UF digitada/selecionada; devolve null se não for uma UF válida. */
export function normalizeUf(value: string | null | undefined): string | null {
  const uf = (value || "").trim().toUpperCase();
  return uf in UF_REGION ? uf : null;
}

export function regionOfUf(uf: string | null | undefined): string {
  const normalized = normalizeUf(uf);
  return normalized ? UF_REGION[normalized] : NO_REGION;
}
