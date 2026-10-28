
/**
 * @vitest-environment jsdom
 */

(globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
}).IS_REACT_ACT_ENVIRONMENT = true;

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SimulationState } from "@the-governor/shared";

vi.mock("../lib/api-client", () => ({
  performAction: vi.fn(),
}));

import ActionsPanel from "../features/construction/ActionsPanel";

function createTestState(
  overrides: Partial<SimulationState> = {},
): SimulationState {
  const initialState: SimulationState = {
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

  return {
    ...initialState,
    ...overrides,
    budget: {
      ...initialState.budget,
      ...overrides.budget,
    },
  };
}

describe("ActionsPanel", () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(() => {
    if (root) {
      act(() => root.unmount());
    }

    container?.remove();
  });

  function renderPanel(state: SimulationState) {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root.render(
        <ActionsPanel state={state} onStateChange={vi.fn()} />,
      );
    });

    return container;
  }

  it("mostra o saldo disponível e quanto falta", () => {
    const state = createTestState({
      budget: {
        ...createTestState().budget,
        cash: 20_000,
      },
    });

    const element = renderPanel(state);

    expect(element.textContent).toContain("Saldo insuficiente");
    expect(element.textContent).toContain("G$ 20.000");
    expect(element.textContent).toContain("Faltam G$ 30.000");

    const button = Array.from(element.querySelectorAll("button")).find(
      (item) => item.textContent?.includes("Ampliar posto de saúde"),
    );

    // Os botões de ação são desabilitados quando faltam recursos.
    expect(
      Array.from(element.querySelectorAll("button")).some(
        (item) => item.disabled && item.textContent === "Saldo insuficiente",
      ),
    ).toBe(true);
  });

  it("mostra quantos Pontos de Ação estão disponíveis", () => {
    const state = createTestState({ actionPoints: 0 });
    const element = renderPanel(state);

    expect(element.textContent).toContain(
      "Pontos de Ação insuficientes.",
    );
    expect(element.textContent).toContain("Necessários: 1");
    expect(element.textContent).toContain("Disponíveis: 0");
    expect(
      Array.from(element.querySelectorAll("button")).some(
        (item) => item.disabled && item.textContent === "Sem pontos de ação",
      ),
    ).toBe(true);
  });
});
