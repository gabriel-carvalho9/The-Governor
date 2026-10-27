import { advanceMonth, createInitialState } from "./engine";

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
});