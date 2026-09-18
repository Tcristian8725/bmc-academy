/**
 * Lista de contas a criar em lote via /api/bulk-create-users (ver esse
 * arquivo para o funcionamento). Cada entrada é processada uma única vez —
 * se o login já existir, é pulada (nunca sobrescreve senha de conta já
 * usada). Depois de uma rodada de criação, é seguro deixar as entradas já
 * processadas aqui (não fazem nada de novo), ou removê-las — à escolha.
 *
 * Pedido do Telles (rodada 23): criar as contas do Adriano e do Júlio, que
 * a automação de navegador não pode fazer diretamente (trava de segurança
 * contra digitar senha de conta de terceiro em formulário).
 */
export interface PendingTechnician {
  name: string;
  login: string; // vira o e-mail/login (não precisa ser um e-mail real)
  tempPassword: string;
  role: "TECNICO" | "RC" | "FUNCIONARIO";
  position?: string;
}

export const PENDING_TECHNICIANS: PendingTechnician[] = [
  {
    name: "Adriano Pereira Lima",
    login: "adriano.lima",
    tempPassword: "461221",
    role: "TECNICO",
  },
  {
    name: "Júlio Carlos Rosa Junior",
    login: "julio.rosa",
    tempPassword: "680380",
    role: "TECNICO",
  },
];
