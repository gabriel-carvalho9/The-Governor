import { useState } from "react";
import type { SimulationState } from "@the-governor/shared";
import { performAction } from "../../lib/api-client";
import { GOVERNOR_ACTIONS } from "../../../../../packages/shared/src/actions";

interface ActionsPanelProps {
  state: SimulationState;
  onStateChange: (state: SimulationState) => void;
}

function formatMoney(value: number): string {
  return `G$ ${value.toLocaleString("pt-BR")}`;
}

export default function ActionsPanel({
  state,
  onStateChange,
}: ActionsPanelProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(actionId: string) {
    setPendingAction(actionId);
    setNotice(null);
    setError(null);

    try {
      const result = await performAction(actionId);

      if (!result.success) {
        setError(result.message);
        return;
      }

      onStateChange(result.state);
      setNotice(result.message);
    } catch {
      setError("Não foi possível executar a ação. Verifique a conexão com o servidor.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section aria-label="Ações de governo">
      <h2>Ações de governo</h2>
      <p>
        Invista os recursos municipais para melhorar os indicadores
        da cidade. Cada ação consome pontos de ação e dinheiro.
      </p>

      <div className="actions-grid">
        {GOVERNOR_ACTIONS.map((action) => {
          const insufficientPoints =
            state.actionPoints < action.actionPointCost;
          const insufficientFunds =
            state.budget.cash < action.financialCost;
          const isPending = pendingAction === action.id;

          return (
            <article className="action-card" key={action.id}>
              <div className="action-heading">
                <h3>{action.name}</h3>
                <span>{action.actionPointCost} PA</span>
              </div>

              <p>{action.description}</p>

              <p className="action-cost">
                Custo: {formatMoney(action.financialCost)}
              </p>

              <ul className="action-effects">
                {Object.entries(action.effects).map(([key, value]) => (
                  <li key={key}>
                    {key}: {value !== undefined && value > 0 ? "+" : ""}
                    {value}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => void handleAction(action.id)}
                disabled={
                  pendingAction !== null ||
                  insufficientPoints ||
                  insufficientFunds
                }
                title={
                  insufficientPoints
                    ? "Pontos de ação insuficientes"
                    : insufficientFunds
                      ? "Dinheiro insuficiente"
                      : undefined
                }
              >
                {isPending
                  ? "Executando..."
                  : insufficientPoints
                    ? "Sem pontos de ação"
                    : insufficientFunds
                      ? "Saldo insuficiente"
                      : "Executar ação"}
              </button>
            </article>
          );
        })}
      </div>

      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}