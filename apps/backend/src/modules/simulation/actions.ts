
import {
  GOVERNOR_ACTIONS,
  type ActionResult,
  type GovernorAction,
  type SimulationState,
  type IndicatorName,
} from "@the-governor/shared";

function cloneState(state: SimulationState): SimulationState {
  return {
    ...state,
    budget: {
      ...state.budget,
      revenueBreakdown: { ...state.budget.revenueBreakdown },
      expenseBreakdown: { ...state.budget.expenseBreakdown },
    },
    indicators: { ...state.indicators },
  };
}

function clampIndicator(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function executeAction(
  state: SimulationState,
  actionId: string,
): ActionResult {
  const action = GOVERNOR_ACTIONS.find(
    (candidate) => candidate.id === actionId,
  );

  if (!action) {
    return {
      success: false,
      state,
      actionId,
      message: "Ação não encontrada.",
      failureReason: "ACTION_NOT_FOUND",
    };
  }

  if (state.actionPoints < action.actionPointCost) {
    return {
      success: false,
      state,
      actionId,
      message: "Pontos de Ação insuficientes.",
      failureReason: "INSUFFICIENT_ACTION_POINTS",
    };
  }

  if (state.budget.cash < action.financialCost) {
    return {
      success: false,
      state,
      actionId,
      message: "Caixa municipal insuficiente.",
      failureReason: "INSUFFICIENT_FUNDS",
    };
  }

  const nextState = cloneState(state);

  nextState.actionPoints -= action.actionPointCost;
  nextState.budget.cash -= action.financialCost;

  for (const [key, change] of Object.entries(action.effects) as [
    IndicatorName,
    number,
  ][]) {
    nextState.indicators[key] = clampIndicator(
      nextState.indicators[key] + change,
    );
  }

  return {
    success: true,
    state: nextState,
    actionId,
    message: `Ação executada: ${action.name}.`,
  };
}