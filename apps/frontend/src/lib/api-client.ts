
import type { ActionResult, SimulationState, TurnReport, TurnResult } from "@the-governor/shared";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `Erro na API: HTTP ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function getSimulation(): Promise<{
  state: SimulationState;
  report: TurnReport | null;
}> {
  return request<{
    state: SimulationState;
    report: TurnReport | null;
  }>("/simulation");
}

export async function advanceMonth(): Promise<TurnResult> {
  return request<TurnResult>("/simulation/advance", {
    method: "POST",
  });
}

export async function performAction(
  actionId: string,
): Promise<ActionResult> {
  return request<ActionResult>("/simulation/actions", {
    method: "POST",
    body: JSON.stringify({ actionId }),
  });
}
