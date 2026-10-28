
/**
 * @vitest-environment jsdom
 */

(globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
}).IS_REACT_ACT_ENVIRONMENT = true;

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SimulationState, TurnReport } from "@the-governor/shared";

const { mockGetSimulation, mockAdvanceMonth } = vi.hoisted(() => ({
  mockGetSimulation: vi.fn(),
  mockAdvanceMonth: vi.fn(),
}));

vi.mock("../lib/api-client", () => ({
  getSimulation: mockGetSimulation,
  advanceMonth: mockAdvanceMonth,
  performAction: vi.fn(),
}));

vi.mock("../features/construction/ActionsPanel", () => ({
  default: () => <div>Ações municipais</div>,
}));

import App from "../app/App";

function createTestState(): SimulationState {
  return {
    cityId: "vale-sereno",
    cityName: "Vale Sereno",
    month: 1,
    year: 1,
    population: 10_000,
    workforce: 4_500,
    actionPoints: 2,
    budget: {
      cash: 100_000,
      monthlyBalance: 80_000,
      monthlyRevenue: 650_000,
      monthlyExpenses: 570_000,
      expenseBreakdown: {
        payroll: 180_000,
        debtService: 40_000,
        maintenance: 90_000,
        publicServices: 260_000,
      },
      revenueBreakdown: {
        taxes: 420_000,
        transfers: 150_000,
        feesAndServices: 80_000,
      },
    },
    indicators: {
      health: 74,
      education: 68,
      housing: 80,
      environment: 82,
      approval: 60,
      employment: 92,
    },
  };
}

function createTestReport(
  event: NonNullable<TurnReport["event"]>,
  summary: string[],
): TurnReport {
  return {
    month: 2,
    year: 1,
    summary,
    event,
    budgetBefore: createTestState().budget,
    budgetAfter: createTestState().budget,
    indicatorChanges: {},
  };
}

describe("App — eventos da cidade", () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(() => {
    if (root) {
      act(() => root.unmount());
    }

    container?.remove();
    vi.clearAllMocks();
  });

  async function renderAppWithEvent(report: TurnReport) {
    mockGetSimulation.mockResolvedValue({
        state: createTestState(),
        report: null,
    });
    mockAdvanceMonth.mockResolvedValue({
      state: { ...createTestState(), month: 2 },
      report,
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    const advanceButton = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => button.textContent?.includes("Avançar um mês"));

    if (!advanceButton) {
      throw new Error("Botão para avançar o mês não encontrado.");
    }

    await act(async () => {
      advanceButton.click();
    });

    return container;
  }

  it("mostra um evento positivo e seus impactos", async () => {
    const report = createTestReport(
      {
        id: "ECONOMIC_BOOM",
        title: "Expansão econômica",
        description: "Novas oportunidades de trabalho movimentam a economia local.",
      },
      [
        "Impacto financeiro do evento: +G$ 75.000.",
        "Impacto do evento em Emprego: +3 ponto(s).",
      ],
    );

    const element = await renderAppWithEvent(report);

    expect(element.textContent).toContain("Expansão econômica");
    expect(element.textContent).toContain(
      "Novas oportunidades de trabalho movimentam a economia local.",
    );
    expect(element.textContent).toContain(
      "Impacto financeiro do evento: +G$ 75.000.",
    );
    expect(element.textContent).toContain(
      "Impacto do evento em Emprego: +3 ponto(s).",
    );
    expect(
      element.querySelector(".city-event--positive"),
    ).not.toBeNull();
  });

  it("mostra um evento negativo com estilo de alerta", async () => {
    const report = createTestReport(
      {
        id: "HEALTH_CRISIS",
        title: "Surto de doença",
        description:
          "Um surto de doença aumenta a pressão sobre os serviços de saúde.",
      },
      [
        "Impacto financeiro do evento: -G$ 50.000.",
        "Impacto do evento em Saúde: -5 ponto(s).",
      ],
    );

    const element = await renderAppWithEvent(report);

    expect(element.textContent).toContain("Surto de doença");
    expect(element.textContent).toContain(
      "Um surto de doença aumenta a pressão sobre os serviços de saúde.",
    );
    expect(element.textContent).toContain(
      "Impacto financeiro do evento: -G$ 50.000.",
    );
    expect(
      element.querySelector(".city-event--negative"),
    ).not.toBeNull();
  });
});