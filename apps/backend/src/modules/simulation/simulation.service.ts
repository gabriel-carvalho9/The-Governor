
import { Injectable } from "@nestjs/common";
import type { SimulationState } from "@the-governor/shared";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { advanceMonth, createInitialState } from "./engine";
import { executeAction } from "./actions";

@Injectable()
export class SimulationService {
  constructor(private readonly prisma: PrismaService) {}

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
      return savedSimulation.state as unknown as SimulationState;
    }

    await this.prisma.simulationSave.create({
      data: {
        cityId: city.id,
        state: initialState as unknown as Prisma.InputJsonValue,
      },
    });

    return initialState;
  }

  async saveState(state: SimulationState): Promise<void> {
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

    const serializedState = state as unknown as Prisma.InputJsonValue;

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

    await this.saveState(result.state);

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
}