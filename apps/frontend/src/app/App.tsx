
import { useCallback, useEffect, useState } from "react";
import type { SimulationState, TurnReport } from "@the-governor/shared";
import { advanceMonth, getSimulation } from "../lib/api-client";
import ActionsPanel from "../features/construction/ActionsPanel";

const indicatorLabels: Record<
  keyof SimulationState["indicators"],
  string
> = {
  health: "Saúde",
  education: "Educação",
  housing: "Habitação",
  environment: "Meio ambiente",
  approval: "Aprovação popular",
  employment: "Emprego",
};

function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).replace("R$", "G$");
}

function App() {
  const [state, setState] = useState<SimulationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [turnReport, setTurnReport] = useState<TurnReport | null>(null);

  const loadSimulation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getSimulation();

      setState(result.state);
      setTurnReport(result.report);
    } catch {
      setError(
        "Não foi possível carregar a cidade. Verifique se o backend está funcionando.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSimulation();
  }, [loadSimulation]);

  async function handleAdvanceMonth() {
    setAdvancing(true);
    setError(null);
    setNotice(null);

    try {
      const result = await advanceMonth();
      setState(result.state);
      setTurnReport(result.report);
      setNotice(
        `Mês ${result.report.month} concluído. A simulação foi salva.`,
      );
    } catch {
      setError(
        "Não foi possível avançar o mês. Verifique a conexão com o backend.",
      );
    } finally {
      setAdvancing(false);
    }
  }

  if (loading) {
    return (
      <main className="app">
        <section className="welcome">
          <p className="eyebrow">SIMULADOR DE GESTÃO URBANA</p>
          <h1>The Governor</h1>
          <p className="description">Carregando sua cidade...</p>
        </section>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="app">
        <section className="welcome">
          <p className="eyebrow">SIMULADOR DE GESTÃO URBANA</p>
          <h1>The Governor</h1>
          <p role="alert">{error}</p>
          <button onClick={() => void loadSimulation()}>
            Tentar novamente
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <section className="welcome">
        <p className="eyebrow">PAINEL DE GESTÃO MUNICIPAL</p>
        <h1>{state.cityName}</h1>
        <p className="description">
          Sua cidade, suas decisões. Administre recursos e acompanhe os
          resultados das suas políticas.
        </p>
        <span className="status">
          Ano {state.year} · Mês {state.month}
        </span>
      </section>

      <section aria-label="Resumo da cidade">
        <h2>Resumo municipal</h2>
        <div className="dashboard-grid">
          <article className="metric">
            <h3>População</h3>
            <p>{state.population.toLocaleString("pt-BR")}</p>
          </article>
          <article className="metric">
            <h3>Caixa municipal</h3>
            <p>{formatMoney(state.budget.cash)}</p>
          </article>
          <article className="metric">
            <h3>Pontos de ação</h3>
            <p>{state.actionPoints}</p>
          </article>
          <article className="metric">
            <h3>Saldo mensal</h3>
            <p>{formatMoney(state.budget.monthlyBalance)}</p>
          </article>
        </div>
      </section>

      <section aria-label="Indicadores municipais">
        <h2>Indicadores da cidade</h2>
        <div className="indicator-list">
          {(Object.keys(indicatorLabels) as Array<
            keyof SimulationState["indicators"]
          >).map((key) => (
            <article className="indicator" key={key}>
              <div className="indicator-heading">
                <span>{indicatorLabels[key]}</span>
                <strong>{state.indicators[key]}/100</strong>
              </div>
              <progress
                value={state.indicators[key]}
                max={100}
                aria-label={indicatorLabels[key]}
              />
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Controle da simulação">
        <h2>Gestão do tempo</h2>
        <p>
          Avance um mês para atualizar o orçamento e a situação da cidade.
        </p>
        <button
          onClick={() => void handleAdvanceMonth()}
          disabled={advancing}
        >
          {advancing ? "Processando mês..." : "Avançar um mês"}
        </button>

        
        {notice && <p role="status">{notice}</p>}
        {error && <p role="alert">{error}</p>}
        
        {turnReport?.event && (
          <section
            className={`city-event ${
              turnReport.event.id === "ECONOMIC_BOOM"
                ? "city-event--positive"
                : "city-event--negative"
            }`}
            aria-live="polite"
            aria-label="Evento do mês"
          >
            <p className="eyebrow">ACONTECEU NA CIDADE</p>
            <h2>{turnReport.event.title}</h2>
            <p>{turnReport.event.description}</p>

            <ul>
              {turnReport.summary
                .filter(
                  (line) =>
                    line.startsWith("Impacto financeiro do evento:") ||
                    line.startsWith("Impacto do evento em "),
                )
                .map((line) => (
                  <li key={line}>{line}</li>
                ))}
            </ul>
          </section>
        )}

      </section>

      <ActionsPanel
        state={state}
        onStateChange={setState}
      />
    </main>
  );
}


export default App;