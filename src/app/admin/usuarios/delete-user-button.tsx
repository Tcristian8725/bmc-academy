"use client";

/** Botão "Excluir" da lista de usuários: pede confirmação antes de enviar. */
export default function DeleteUserButton({
  action,
  name,
}: {
  action: (formData: FormData) => void | Promise<void>;
  name: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `Excluir "${name}"? A pessoa perde o acesso e some das listas, mas todo o histórico (progresso, provas e certificados) fica guardado. Dá para restaurar depois em Usuários > Excluídos, e ela continua de onde parou.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="confirm" value="yes" />
      <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
        Excluir
      </button>
    </form>
  );
}
