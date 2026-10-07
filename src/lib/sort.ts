/** Ordem alfabética em português (ignora maiúsculas/acentos): A, Á, B… */
export function compareNames(a: string | null | undefined, b: string | null | undefined): number {
  return (a ?? "").localeCompare(b ?? "", "pt-BR", { sensitivity: "base", numeric: true });
}
