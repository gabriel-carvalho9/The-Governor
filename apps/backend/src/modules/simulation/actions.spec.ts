
/// <reference types="jest" />

import { createInitialState } from "./engine";
import { executeAction } from "./actions";

describe("executeAction", () => {
  it("executa uma ação válida e aplica seus custos e efeitos", () => {
    const initialState = createInitialState();

    const result = executeAction(initialState, "expand-health-clinic");

    expect(result.success).toBe(true);
    expect(result.state.actionPoints).toBe(1);
    expect(result.state.budget.cash).toBe(2_450_000);
    expect(result.state.indicators.health).toBe(76);
    expect(initialState.actionPoints).toBe(2);
    expect(initialState.budget.cash).toBe(2_500_000);
    expect(initialState.indicators.health).toBe(74);
  });

  it("recusa uma ação inexistente sem alterar o estado", () => {
    const initialState = createInitialState();

    const result = executeAction(initialState, "acao-inexistente");

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe("ACTION_NOT_FOUND");
    expect(result.state).toBe(initialState);
    expect(initialState.actionPoints).toBe(2);
    expect(initialState.budget.cash).toBe(2_500_000);
  });

  it("recusa uma ação quando não há Pontos de Ação suficientes", () => {
    const initialState = {
      ...createInitialState(),
      actionPoints: 0,
    };

    const result = executeAction(initialState, "expand-health-clinic");

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe("INSUFFICIENT_ACTION_POINTS");
    expect(result.state).toBe(initialState);
    expect(initialState.budget.cash).toBe(2_500_000);
  });

  it("recusa uma ação quando o caixa é insuficiente", () => {
    const initialState = {
      ...createInitialState(),
      budget: {
        ...createInitialState().budget,
        cash: 20_000,
      },
    };

    const result = executeAction(initialState, "expand-health-clinic");

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe("INSUFFICIENT_FUNDS");
    expect(result.state).toBe(initialState);
    expect(initialState.actionPoints).toBe(2);
    expect(initialState.budget.cash).toBe(20_000);
  });

  it("limita indicadores a 100", () => {
    const initialState = {
      ...createInitialState(),
      indicators: {
        ...createInitialState().indicators,
        health: 99,
      },
    };

    const result = executeAction(initialState, "expand-health-clinic");

    expect(result.success).toBe(true);
    expect(result.state.indicators.health).toBe(100);
  });

  it("limita indicadores a 0", () => {
    const initialState = {
      ...createInitialState(),
      indicators: {
        ...createInitialState().indicators,
        health: 0,
      },
    };

    const result = executeAction(initialState, "vaccination-campaign");

    expect(result.success).toBe(true);
    expect(result.state.indicators.health).toBe(1);
  });

  it("preserva os dados do orçamento original ao executar uma ação", () => {
    const initialState = createInitialState();
    const originalBudget = structuredClone(initialState.budget);

    executeAction(initialState, "expand-health-clinic");

    expect(initialState.budget).toEqual(originalBudget);
  });

  it("não altera o estado original ao executar uma ação válida", () => {
    const initialState = createInitialState();
    const originalState = structuredClone(initialState);

    executeAction(initialState, "expand-health-clinic");

    expect(initialState).toEqual(originalState);
  });
});