import { advanceMonth, createInitialState } from "./engine";
import type { Budget } from "@the-governor/shared";

describe("Simulation engine", () => {
  it("creates Vale Sereno with the initial budget", () => {
    const state = createInitialState();

    expect(state.cityName).toBe("Vale Sereno");
    expect(state.population).toBe(10_000);
    expect(state.budget.cash).toBe(2_500_000);
    expect(state.budget.monthlyRevenue).toBe(650_000);
    expect(state.budget.monthlyExpenses).toBe(570_000);
    expect(state.budget.monthlyBalance).toBe(80_000);
  });

  it("adds the monthly surplus to the cash balance", () => {
    const state = createInitialState();
    const result = advanceMonth(state);

    expect(result.state.budget.cash).toBe(2_580_000);
    expect(result.report.budgetAfter.monthlyBalance).toBe(80_000);
  });

  it("does not mutate the original state", () => {
    const state = createInitialState();
    advanceMonth(state);

    expect(state.month).toBe(1);
    expect(state.year).toBe(1);
    expect(state.budget.cash).toBe(2_500_000);
  });

  it("advances the calendar after twelve months", () => {
    let state = createInitialState();

    for (let i = 0; i < 12; i++) {
      state = advanceMonth(state).state;
    }

    expect(state.month).toBe(1);
    expect(state.year).toBe(2);
    expect(state.budget.cash).toBe(3_460_000);
  });

  it("restores two action points at the start of the next month", () => {
    const state = createInitialState();
    state.actionPoints = 0;

    const result = advanceMonth(state);

    expect(result.state.actionPoints).toBe(2);
  });

  it("does not mutate the original budget or nested breakdowns", () => {
    const state = createInitialState();
    const originalTaxes = state.budget.revenueBreakdown.taxes;

    const result = advanceMonth(state);

    result.state.budget.revenueBreakdown.taxes = 0;

    expect(state.budget.revenueBreakdown.taxes).toBe(originalTaxes);
  });

  it("rejects negative revenue values", () => {
    const state = createInitialState();
    state.budget.revenueBreakdown.taxes = -1;

    expect(() => advanceMonth(state)).toThrow(
      "Orçamento inválido: impostos deve ser um número finito não negativo.",
    );
  });

  it("rejects non-finite expense values", () => {
    const state = createInitialState();
    state.budget.expenseBreakdown.payroll = Number.NaN;

    expect(() => advanceMonth(state)).toThrow(
      "Orçamento inválido: folha de pagamento deve ser um número finito não negativo.",
    );
  });

  
  it("reduces approval by two points when the monthly closing cash is negative", () => {
    const state = createInitialState();
    state.budget.cash = 0;
    state.budget.expenseBreakdown.publicServices = 700_000;

    const result = advanceMonth(state);

    expect(result.state.budget.cash).toBe(-360_000);
    expect(result.state.indicators.approval).toBe(60);
    expect(result.report.indicatorChanges.approval).toBe(-2);
    expect(result.report.summary).toContain(
      "Crise financeira: a aprovação caiu 2 pontos por causa do caixa negativo.",
    );
  });

  it("does not reduce approval when monthly closing cash is zero or positive", () => {
    const state = createInitialState();
    const result = advanceMonth(state);

    expect(result.state.indicators.approval).toBe(62);
    expect(result.report.indicatorChanges.approval).toBeUndefined();
  });

  it("never reduces approval below zero", () => {
    const state = createInitialState();
    state.budget.cash = 0;
    state.budget.expenseBreakdown.publicServices = 700_000;
    state.indicators.approval = 1;

    const result = advanceMonth(state);

    expect(result.state.indicators.approval).toBe(0);
    expect(result.report.indicatorChanges.approval).toBe(-1);
  });
});