
import type { CityEvent, CityEventType } from "@the-governor/shared";

export interface CityEventOutcome {
  event: CityEvent;
  budgetChange: number;
  indicatorChanges: Partial<
    Record<
      "health" | "education" | "housing" | "environment" | "approval" | "employment",
      number
    >
  >;
}

const CITY_EVENTS: CityEventOutcome[] = [
  {
    event: {
      id: "HEALTH_CRISIS",
      title: "Surto de doença",
      description:
        "Um surto de doença aumenta a pressão sobre os serviços de saúde.",
    },
    budgetChange: -50_000,
    indicatorChanges: {
      health: -5,
      approval: -2,
    },
  },
  {
    event: {
      id: "ECONOMIC_BOOM",
      title: "Expansão econômica",
      description:
        "Novas oportunidades de trabalho movimentam a economia local.",
    },
    budgetChange: 75_000,
    indicatorChanges: {
      employment: 3,
      approval: 2,
    },
  },
  {
    event: {
      id: "SEVERE_STORM",
      title: "Tempestade severa",
      description:
        "Uma tempestade provoca danos e exige gastos emergenciais.",
    },
    budgetChange: -60_000,
    indicatorChanges: {
      environment: -4,
      housing: -2,
      approval: -1,
    },
  },
];

export function getRandomCityEvent(): CityEventOutcome | null {
  if (Math.random() >= 0.35) {
    return null;
  }

  const index = Math.floor(Math.random() * CITY_EVENTS.length);
  const selectedEvent = CITY_EVENTS[index];

  if (!selectedEvent) {
    return null;
  }

  return {
    ...selectedEvent,
    event: { ...selectedEvent.event },
    indicatorChanges: { ...selectedEvent.indicatorChanges },
  };
}
