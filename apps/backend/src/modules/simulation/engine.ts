import type { Budget, SimulationState, TurnResult } from "@the-governor/shared";

function cloneBudget(budget: Budget): Budget {
  return {
    ...budget,
    revenueBreakdown: { ...budget.revenueBreakdown },
    expenseBreakdown: { ...budget.expenseBreakdown },
  };
}

function validateBudget(budget: Budget): void {
  const values: [string, number][] = [
    ["caixa municipal", budget.cash],
    ["impostos", budget.revenueBreakdown.taxes],
    ["taxas e serviços", budget.revenueBreakdown.feesAndServices],
    ["transferências", budget.revenueBreakdown.transfers],
    ["serviços públicos", budget.expenseBreakdown.publicServices],
    ["folha de pagamento", budget.expenseBreakdown.payroll],
    ["manutenção", budget.expenseBreakdown.maintenance],
    ["serviço da dívida", budget.expenseBreakdown.debtService],
  ];

  for (const [name, value] of values) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(
        `Orçamento inválido: ${name} deve ser um número finito não negativo.`,
      );
    }
  }
}

function calculateBudget(budget: Budget): Budget {
  validateBudget(budget);

  const monthlyRevenue =
    budget.revenueBreakdown.taxes +
    budget.revenueBreakdown.feesAndServices +
    budget.revenueBreakdown.transfers;

  const monthlyExpenses =
    budget.expenseBreakdown.publicServices +
    budget.expenseBreakdown.payroll +
    budget.expenseBreakdown.maintenance +
    budget.expenseBreakdown.debtService;

  return {
    ...cloneBudget(budget),
    monthlyRevenue,
    monthlyExpenses,
    monthlyBalance: monthlyRevenue - monthlyExpenses,
  };
}

export function createInitialState(): SimulationState {
  const budget = calculateBudget({
    cash: 2_500_000,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    monthlyBalance: 0,
    revenueBreakdown: {
      taxes: 420_000,
      feesAndServices: 80_000,
      transfers: 150_000,
    },
    expenseBreakdown: {
      publicServices: 260_000,
      payroll: 180_000,
      maintenance: 90_000,
      debtService: 40_000,
    },
  });

  return {
    cityId: "vale-sereno",
    cityName: "Vale Sereno",
    month: 1,
    year: 1,
    population: 10_000,
    workforce: 4_500,
    actionPoints: 2,
    budget,
    indicators: {
      health: 74,
      education: 68,
      housing: 80,
      environment: 82,
      approval: 62,
      employment: 92,
    },
  };
}

export function advanceMonth(state: SimulationState): TurnResult {
  const budgetBefore = cloneBudget(state.budget);
  const budgetAfter = calculateBudget(state.budget);

  budgetAfter.cash += budgetAfter.monthlyBalance;

  const nextMonth = state.month === 12 ? 1 : state.month + 1;
  const nextYear = state.month === 12 ? state.year + 1 : state.year;

  const nextState: SimulationState = {
    ...state,
    month: nextMonth,
    year: nextYear,
    actionPoints: 2,
    budget: budgetAfter,
    indicators: { ...state.indicators },
  };

  return {
    state: nextState,
    report: {
      month: state.month,
      year: state.year,
      summary: [
        `Receita mensal: G$ ${budgetAfter.monthlyRevenue.toLocaleString("pt-BR")}.`,
        `Despesas mensais: G$ ${budgetAfter.monthlyExpenses.toLocaleString("pt-BR")}.`,
        `Resultado do mês: G$ ${budgetAfter.monthlyBalance.toLocaleString("pt-BR")}.`,
        `Caixa municipal: G$ ${budgetAfter.cash.toLocaleString("pt-BR")}.`,
      ],
      budgetBefore,
      budgetAfter: { ...budgetAfter },
      indicatorChanges: {},
    },
  };
}