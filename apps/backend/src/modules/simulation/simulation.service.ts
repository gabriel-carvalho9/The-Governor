
import { Injectable } from "@nestjs/common";
import type { SimulationState, TurnReport, TurnResult, } from "@the-governor/shared";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { advanceMonth, createInitialState } from "./engine";
import { executeAction } from "./actions";

interface PersistedSimulation {
  state: SimulationState;
  lastReport: TurnReport | null;
}

@Injectable()
export class SimulationService {
  constructor(private readonly prisma: PrismaService) {}

  private readPersistedSimulation(
    value: unknown,
    fallbackState: SimulationState,
  ): PersistedSimulation {
    if (
      typeof value === "object" &&
      value !== null &&
      "state" in value
    ) {
      const persisted = value as PersistedSimulation;

      return {
        state: persisted.state,
        lastReport: persisted.lastReport ?? null,
      };
    }

    return {
      state: (value ?? fallbackState) as SimulationState,
      lastReport: null,
    };
  }

  async loadOrCreateInitialState(): Promise<SimulationState> {
    const initialState = createInitialState();

    const city = await this.prisma.city.upsert({
      where: { slug: initialState.cityId },
      create: {
        slug: initialState.cityId,
        name: initialState.cityName,
      },
      update: {
        name: initialState.cityName,
      },
    });

    const savedSimulation = await this.prisma.simulationSave.findFirst({
      where: { cityId: city.id },
      orderBy: { updatedAt: "desc" },
    });

    if (savedSimulation) {
      const persisted = this.readPersistedSimulation(
        savedSimulation.state,
        initialState,
      );

      return persisted.state;
    }

    await this.prisma.simulationSave.create({
      data: {
        cityId: city.id,
        state: initialState as unknown as Prisma.InputJsonValue,
      },
    });

    return initialState;
  }

  async saveState(
    state: SimulationState,
    lastReport?: TurnReport | null,
  ): Promise<void> {
    const city = await this.prisma.city.upsert({
      where: { slug: state.cityId },
      create: {
        slug: state.cityId,
        name: state.cityName,
      },
      update: {
        name: state.cityName,
      },
    });

    const existingSave = await this.prisma.simulationSave.findFirst({
      where: { cityId: city.id },
      orderBy: { updatedAt: "desc" },
    });

    const previousData = existingSave
      ? this.readPersistedSimulation(existingSave.state, state)
      : {
          state,
          lastReport: null,
        };

    const serializedState = {
      state,
      lastReport: lastReport === undefined
        ? previousData.lastReport
        : lastReport,
    } as unknown as Prisma.InputJsonValue;

    if (existingSave) {
      await this.prisma.simulationSave.update({
        where: { id: existingSave.id },
        data: { state: serializedState },
      });

      return;
    }

    await this.prisma.simulationSave.create({
      data: {
        cityId: city.id,
        state: serializedState,
      },
    });
  }

  async advanceCurrentMonth() {
    const currentState = await this.loadOrCreateInitialState();
    const result = advanceMonth(currentState);

    await this.saveState(result.state, result.report);

    return result;
  }

  async performAction(actionId: string) {
    const currentState = await this.loadOrCreateInitialState();
    const result = executeAction(currentState, actionId);

    if (result.success) {
        await this.saveState(result.state);
    }

    return result;
  }

  async loadSimulationData(): Promise<PersistedSimulation> {
    const state = await this.loadOrCreateInitialState();
    const city = await this.prisma.city.findUnique({
      where: { slug: state.cityId },
    });

    if (!city) {
      return {
        state,
        lastReport: null,
      };
    }

    const savedSimulation = await this.prisma.simulationSave.findFirst({
      where: { cityId: city.id },
      orderBy: { updatedAt: "desc" },
    });

    if (!savedSimulation) {
      return {
        state,
        lastReport: null,
      };
    }

    return this.readPersistedSimulation(savedSimulation.state, state);
  }
}