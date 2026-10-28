import type { Budget } from "./budget";

export type IndicatorName =
  | "health"
  | "education"
  | "housing"
  | "environment"
  | "approval"
  | "employment";

  export type CityEventType =
  | "HEALTH_CRISIS"
  | "ECONOMIC_BOOM"
  | "SEVERE_STORM";

export interface CityEvent {
  id: CityEventType;
  title: string;
  description: string;
}

export interface CityIndicators {
  health: number;
  education: number;
  housing: number;
  environment: number;
  approval: number;
  employment: number;
}

export interface SimulationState {
  cityId: string;
  cityName: string;
  month: number;
  year: number;
  population: number;
  workforce: number;
  actionPoints: number;
  budget: Budget;
  indicators: CityIndicators;
}

export interface TurnReport {
  month: number;
  year: number;
  summary: string[];
  event?: CityEvent;
  budgetBefore: Budget;
  budgetAfter: Budget;
  indicatorChanges: Partial<Record<IndicatorName, number>>;
}

export interface TurnResult {
  state: SimulationState;
  report: TurnReport;
}