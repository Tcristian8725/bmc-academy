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
            `Excluir "${name}" de vez? Isso apaga também o progresso, as provas e os certificados dessa pessoa e não dá para desfazer.`
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
