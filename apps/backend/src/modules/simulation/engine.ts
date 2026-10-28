import type {
  Budget,
  CityEvent,
  IndicatorName,
  SimulationState,
  TurnResult,
} from "@the-governor/shared";

import { getRandomCityEvent } from "./city-events";

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

function clampIndicator(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function calculateSpendingEffects(
  budget: Budget,
): Partial<Record<IndicatorName, number>> {
  const changes: Partial<Record<IndicatorName, number>> = {};

  const publicServices = budget.expenseBreakdown.publicServices;

  if (publicServices < 208_000) {
    changes.health = -1;
    changes.education = -1;
  } else if (publicServices > 312_000) {
    changes.health = 1;
    changes.education = 1;
  }

  const maintenance = budget.expenseBreakdown.maintenance;

  if (maintenance < 72_000) {
    changes.environment = -1;
  } else if (maintenance > 108_000) {
    changes.environment = 1;
  }

  return changes;
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

  const cityEventOutcome = getRandomCityEvent();
  const event: CityEvent | undefined = cityEventOutcome?.event;

  if (cityEventOutcome) {
    budgetAfter.cash += cityEventOutcome.budgetChange;
  }

  const indicatorChanges = calculateSpendingEffects(budgetAfter);

  if (cityEventOutcome) {
    for (const [key, change] of Object.entries(
      cityEventOutcome.indicatorChanges,
    ) as [IndicatorName, number][]) {
      indicatorChanges[key] = (indicatorChanges[key] ?? 0) + change;
    }
  }
 
const approvalBefore = state.indicators.approval;
const approvalPenalty = budgetAfter.cash < 0 ? 2 : 0;

if (approvalPenalty > 0) {
  indicatorChanges.approval =
    (indicatorChanges.approval ?? 0) - approvalPenalty;
}

const approvalAfter = clampIndicator(
  approvalBefore + (indicatorChanges.approval ?? 0),
);
const approvalChange = approvalAfter - approvalBefore;

if (approvalChange !== 0) {
  indicatorChanges.approval = approvalChange;
} else {
  delete indicatorChanges.approval;
}


  const nextIndicators = {
  health: clampIndicator(
    state.indicators.health + (indicatorChanges.health ?? 0),
  ),
  education: clampIndicator(
    state.indicators.education + (indicatorChanges.education ?? 0),
  ),
  housing: clampIndicator(
    state.indicators.housing + (indicatorChanges.housing ?? 0),
  ),
  environment: clampIndicator(
    state.indicators.environment + (indicatorChanges.environment ?? 0),
  ),
  approval: clampIndicator(
    state.indicators.approval + (indicatorChanges.approval ?? 0),
  ),
  employment: clampIndicator(
    state.indicators.employment + (indicatorChanges.employment ?? 0),
  ),
};

  for (const key of [
  "health",
  "education",
  "housing",
  "environment",
  "approval",
  "employment",
] as const) {
  const actualChange =
    nextIndicators[key] - state.indicators[key];

  if (actualChange === 0) {
    delete indicatorChanges[key];
  } else {
    indicatorChanges[key] = actualChange;
  }
}

  const nextMonth = state.month === 12 ? 1 : state.month + 1;
  const nextYear = state.month === 12 ? state.year + 1 : state.year;

  const nextState: SimulationState = {
    ...state,
    month: nextMonth,
    year: nextYear,
    actionPoints: 2,
    budget: budgetAfter,
    indicators: nextIndicators,
  };

  const summary = [
    `Receita mensal: G$ ${budgetAfter.monthlyRevenue.toLocaleString("pt-BR")}.`,
    `Despesas mensais: G$ ${budgetAfter.monthlyExpenses.toLocaleString("pt-BR")}.`,
    `Resultado do mês: G$ ${budgetAfter.monthlyBalance.toLocaleString("pt-BR")}.`,
    `Caixa municipal: G$ ${budgetAfter.cash.toLocaleString("pt-BR")}.`,
  ];
  
  if (cityEventOutcome) {
  summary.push(
    `Evento da cidade: ${cityEventOutcome.event.title}.`,
    cityEventOutcome.event.description,
  );

  if (cityEventOutcome.budgetChange !== 0) {
    const signal = cityEventOutcome.budgetChange > 0 ? "+" : "";
    summary.push(
      `Impacto financeiro do evento: ${signal}G$ ${cityEventOutcome.budgetChange.toLocaleString("pt-BR")}.`,
    );
  }

  for (const [indicator, change] of Object.entries(
    cityEventOutcome.indicatorChanges,
  ) as [IndicatorName, number][]) {
    const label: Record<IndicatorName, string> = {
      health: "Saúde",
      education: "Educação",
      housing: "Habitação",
      environment: "Meio ambiente",
      approval: "Aprovação",
      employment: "Emprego",
    };

    const signal = change > 0 ? "+" : "";
    summary.push(
      `Impacto do evento em ${label[indicator]}: ${signal}${change} ponto(s).`,
    );
  }
}

  if (budgetAfter.cash < 0) {
    if (approvalChange < 0) {
      summary.push(
        `Crise financeira: a aprovação caiu ${Math.abs(approvalChange)} pontos por causa do caixa negativo.`,
      );
    } else {
      summary.push(
        "Crise financeira: o caixa municipal fechou negativo.",
      );
    }
  }

  return {
    state: nextState,
    report: {
      month: state.month,
      year: state.year,
      summary,
      ...(event ? { event } : {}),
      budgetBefore,
      budgetAfter: cloneBudget(budgetAfter),
      indicatorChanges,
    },
  };
}
