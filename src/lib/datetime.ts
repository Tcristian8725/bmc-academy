// Formatacao de data/hora em horario de Brasilia (rodada 36).
//
// toLocaleDateString/toLocaleString sem timeZone usam o fuso do runtime
// que esta rodando o codigo -- em producao (Vercel/Node) isso e UTC, nao
// o horario de Brasilia, entao qualquer hora exibida ficava 3h adiantada
// (e, perto da meia-noite em Brasilia, ate a DATA podia aparecer errada).
// Foi isso que, a primeira vista, fez o cadastro de um usuario parecer ter
// acontecido depois de um deploy que na verdade so veio depois em horario
// de Brasilia. Estas funcoes fixam o fuso explicitamente para que a
// data/hora exibida seja sempre a de Brasilia, independente de onde o
// codigo estiver rodando.

const BRAZIL_TIME_ZONE = "America/Sao_Paulo";

/** Formata so a data (dd/mm/aaaa) em horario de Brasilia. */
export function formatDateBR(date: Date | string | number): string {
    return new Date(date).toLocaleDateString("pt-BR", { timeZone: BRAZIL_TIME_ZONE });
}

/** Formata data + hora (dd/mm/aaaa, hh:mm:ss) em horario de Brasilia. */
export function formatDateTimeBR(date: Date | string | number): string {
    return new Date(date).toLocaleString("pt-BR", { timeZone: BRAZIL_TIME_ZONE });
}
