/// <reference types="jest" />
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

  it("reduces health and education when public services spending is too low", () => {
    const state = createInitialState();
    state.budget.expenseBreakdown.publicServices = 200_000;

    const result = advanceMonth(state);

    expect(result.state.indicators.health).toBe(73);
    expect(result.state.indicators.education).toBe(67);
  });

  it("improves health and education when public services spending is high", () => {
    const state = createInitialState();
    state.budget.expenseBreakdown.publicServices = 320_000;

    const result = advanceMonth(state);

    expect(result.state.indicators.health).toBe(75);
    expect(result.state.indicators.education).toBe(69);
    expect(result.report.indicatorChanges.health).toBe(1);
    expect(result.report.indicatorChanges.education).toBe(1);
  });

  it("reduces the environment indicator when maintenance spending is too low", () => {
    const state = createInitialState();
    state.budget.expenseBreakdown.maintenance = 70_000;

    const result = advanceMonth(state);

    expect(result.state.indicators.environment).toBe(81);
    expect(result.report.indicatorChanges.environment).toBe(-1);
  });

  it("improves the environment indicator when maintenance spending is high", () => {
    const state = createInitialState();
    state.budget.expenseBreakdown.maintenance = 110_000;

    const result = advanceMonth(state);

    expect(result.state.indicators.environment).toBe(83);
    expect(result.report.indicatorChanges.environment).toBe(1);
  });
  
  it("never increases health or education above 100", () => {
    const state = createInitialState();
    state.budget.expenseBreakdown.publicServices = 320_000;
    state.indicators.health = 100;
    state.indicators.education = 100;

    const result = advanceMonth(state);

    expect(result.state.indicators.health).toBe(100);
    expect(result.state.indicators.education).toBe(100);
    expect(result.report.indicatorChanges.health).toBeUndefined();
    expect(result.report.indicatorChanges.education).toBeUndefined();
  });

  it("never decreases health or education below zero", () => {
    const state = createInitialState();
    state.budget.expenseBreakdown.publicServices = 200_000;
    state.indicators.health = 0;
    state.indicators.education = 0;

    const result = advanceMonth(state);

    expect(result.state.indicators.health).toBe(0);
    expect(result.state.indicators.education).toBe(0);
    expect(result.report.indicatorChanges.health).toBeUndefined();
    expect(result.report.indicatorChanges.education).toBeUndefined();
  });
});