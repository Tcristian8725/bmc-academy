"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { completeProfileAction, type CompleteProfileState } from "./actions";
import { UFS } from "@/lib/regions";
import { formatCep, formatCnpj, formatCpf, onlyDigits } from "@/lib/documents";

const initialState: CompleteProfileState = {};

const TIPOS = [
  ["TECNICO", "Técnico"],
  ["RC", "Representante Comercial"],
  ["FUNCIONARIO_BMC", "Funcionário BMC"],
] as const;

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const lockedClass = "bg-gray-50 text-gray-600";
const labelClass = "mb-1 block text-sm font-medium text-gray-700";

type CepStatus = "idle" | "loading" | "found" | "notfound" | "error";

export default function CadastroForm() {
  const [state, formAction, pending] = useActionState(completeProfileAction, initialState);
  const router = useRouter();

  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [cepStatus, setCepStatus] = useState<CepStatus>("idle");
  // Campos vindos do CEP ficam travados; se o CEP for genérico (sem rua) ou não
  // for encontrado, a pessoa preenche à mão.
  const [streetLocked, setStreetLocked] = useState(false);
  const [neighborhoodLocked, setNeighborhoodLocked] = useState(false);
  const [cityLocked, setCityLocked] = useState(false);
  const numberRef = useRef<HTMLInputElement | null>(null);
  const lastLookup = useRef("");

  useEffect(() => {
    if (state.success) {
      // Cadastro enviado: vai para a tela "Aguardando aprovação".
      router.push("/aguardando-aprovacao");
      router.refresh();
    }
  }, [state.success, router]);

  async function lookupCep(digits: string) {
    if (digits.length !== 8 || lastLookup.current === digits) return;
    lastLookup.current = digits;
    setCepStatus("loading");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!res.ok) throw new Error("http " + res.status);
      const data = (await res.json()) as {
        erro?: boolean | string;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (data.erro) {
        setCepStatus("notfound");
        setStreetLocked(false);
        setNeighborhoodLocked(false);
        setCityLocked(false);
        return;
      }
      setStreet(data.logradouro ?? "");
      setNeighborhood(data.bairro ?? "");
      setCity(data.localidade ?? "");
      setUf((data.uf ?? "").toUpperCase());
      setStreetLocked(Boolean(data.logradouro));
      setNeighborhoodLocked(Boolean(data.bairro));
      setCityLocked(true);
      setCepStatus("found");
      numberRef.current?.focus();
    } catch {
      setCepStatus("error");
      setStreetLocked(false);
      setNeighborhoodLocked(false);
      setCityLocked(false);
    }
  }

  function handleCepChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCep(e.target.value);
    setCep(formatted);
    const digits = onlyDigits(formatted);
    if (digits.length < 8) {
      lastLookup.current = "";
      setCepStatus("idle");
    } else {
      void lookupCep(digits);
    }
  }

  // Depois do CEP, o resto do endereço só aparece/habilita quando já foi
  // consultado (ou quando a consulta falhou e a pessoa precisa digitar).
  const showAddress = cepStatus === "found" || cepStatus === "notfound" || cepStatus === "error";

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className={labelClass}>Nome completo</label>
        <input name="name" required autoComplete="name" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>CPF</label>
        <input
          name="cpf"
          required
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(formatCpf(e.target.value))}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>CNPJ (somente se for de uma empresa terceirizada)</label>
        <input
          name="cnpj"
          inputMode="numeric"
          placeholder="00.000.000/0000-00 (opcional)"
          value={cnpj}
          onChange={(e) => setCnpj(formatCnpj(e.target.value))}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-400">
          Pode ser o mesmo CNPJ de outra pessoa — várias pessoas da mesma empresa podem usar o
          mesmo CNPJ.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 p-3">
        <p className="mb-3 text-sm font-semibold text-gray-700">Endereço</p>

        <div>
          <label className={labelClass}>CEP</label>
          <input
            name="cep"
            required
            inputMode="numeric"
            placeholder="00000-000"
            value={cep}
            onChange={handleCepChange}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-400">
            {cepStatus === "loading" && "Buscando endereço…"}
            {cepStatus === "found" && "Endereço encontrado — complete só o número."}
            {cepStatus === "notfound" && "CEP não encontrado. Confira o número ou preencha o endereço abaixo."}
            {cepStatus === "error" &&
              "Não foi possível buscar o CEP agora. Preencha o endereço abaixo."}
            {cepStatus === "idle" && "Digite o CEP e o endereço é preenchido automaticamente."}
          </p>
        </div>

        {showAddress && (
          <div className="mt-3 space-y-3">
            <div>
              <label className={labelClass}>Rua / Avenida</label>
              <input
                name="street"
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                readOnly={streetLocked}
                className={`${inputClass} ${streetLocked ? lockedClass : ""}`}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className={labelClass}>Número</label>
                <input
                  name="number"
                  required
                  ref={numberRef}
                  placeholder="Ex.: 120"
                  className={inputClass}
                />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Complemento (opcional)</label>
                <input name="complement" placeholder="Apto, bloco, sala…" className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Bairro</label>
              <input
                name="neighborhood"
                required
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                readOnly={neighborhoodLocked}
                className={`${inputClass} ${neighborhoodLocked ? lockedClass : ""}`}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelClass}>Cidade</label>
                <input
                  name="city"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  readOnly={cityLocked}
                  className={`${inputClass} ${cityLocked ? lockedClass : ""}`}
                />
              </div>
              <div className="col-span-1">
                <label className={labelClass}>UF</label>
                {cityLocked ? (
                  <>
                    <input name="state" value={uf} readOnly className={`${inputClass} ${lockedClass}`} />
                  </>
                ) : (
                  <select
                    name="state"
                    required
                    value={uf}
                    onChange={(e) => setUf(e.target.value)}
                    className={`${inputClass} bg-white`}
                  >
                    <option value="" disabled>
                      UF
                    </option>
                    {UFS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className={labelClass}>Qual é o seu vínculo?</label>
        <div className="space-y-2">
          {TIPOS.map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="tipo" value={v} required className="accent-[--color-brand]" />
              {l}
            </label>
          ))}
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || !showAddress}
        className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar cadastro para aprovação"}
      </button>
      <p className="text-center text-xs text-gray-400">
        Depois de enviar, o seu acesso fica aguardando a aprovação da equipe da BMC Academy.
      </p>
    </form>
  );
}
