import type { IndicatorName, SimulationState } from "./simulation";

export interface GovernorAction {
  id: string;
  name: string;
  category: ActionCategory;
  actionPointCost: number;
  financialCost: number;
  effects: Partial<Record<IndicatorName, number>>;
  description: string;
}

export type ActionCategory =
  | "health"
  | "education"
  | "housing"
  | "environment"
  | "employment"
  | "government";
  
  export type ActionFailureReason =
  | "ACTION_NOT_FOUND"
  | "INSUFFICIENT_ACTION_POINTS"
  | "INSUFFICIENT_FUNDS";

export interface ActionResult {
  success: boolean;
  state: SimulationState;
  message: string;
  actionId: string;
  failureReason?: ActionFailureReason;
}