import { redirect } from "next/navigation";

// O perfil "Gestor" deixou de existir (rodada 42). Links antigos voltam para a página inicial.
export default function GestorRemovido() {
  redirect("/");
}
