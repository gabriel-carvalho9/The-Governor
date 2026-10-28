jest.mock("@nestjs/common", () => ({
  Injectable: () => (target: unknown) => target,
  Global: () => (target: unknown) => target,
  Module: () => (target: unknown) => target,
}));

import { SimulationService } from "./simulation.service";
import { createInitialState } from "./engine";
import { PrismaService } from "../../prisma/prisma.service";

describe("SimulationService", () => {
  let service: SimulationService;
  let prisma: {
    city: {
      upsert: jest.Mock;
    };
    simulationSave: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      city: {
        upsert: jest.fn().mockResolvedValue({
          id: "city-test-id",
          slug: "vale-sereno",
          name: "Vale Sereno",
        }),
      },
      simulationSave: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new SimulationService(
      prisma as unknown as PrismaService,
    );
  });

  it("não salva o estado quando a ação não existe", async () => {
    const initialState = createInitialState();

    prisma.simulationSave.findFirst.mockResolvedValue({
      id: "save-test-id",
      cityId: "city-test-id",
      state: initialState,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.performAction(
      "acao-que-nao-existe",
    );

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Era esperada uma falha na ação.");
    }

    expect(result.failureReason).toBe("ACTION_NOT_FOUND");
    expect(result.state).toEqual(initialState);
    expect(prisma.simulationSave.update).not.toHaveBeenCalled();
    expect(prisma.simulationSave.create).not.toHaveBeenCalled();
  });

  
  it("carrega o estado que já está salvo", async () => {
    const savedState = {
      ...createInitialState(),
      month: 5,
      year: 2,
      population: 12_000,
    };

    prisma.simulationSave.findFirst.mockResolvedValue({
      id: "save-test-id",
      cityId: "city-test-id",
      state: savedState,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.loadOrCreateInitialState();

    expect(result).toEqual(savedState);
    expect(result.month).toBe(5);
    expect(result.year).toBe(2);
    expect(result.population).toBe(12_000);

    expect(prisma.simulationSave.findFirst).toHaveBeenCalledWith({
      where: { cityId: "city-test-id" },
      orderBy: { updatedAt: "desc" },
    });

    expect(prisma.simulationSave.create).not.toHaveBeenCalled();
    expect(prisma.simulationSave.update).not.toHaveBeenCalled();
  });

    it("cria o estado inicial quando não existe salvamento", async () => {
    prisma.simulationSave.findFirst.mockResolvedValue(null);
    prisma.simulationSave.create.mockResolvedValue({
        id: "save-test-id",
        cityId: "city-test-id",
        state: createInitialState(),
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    const result = await service.loadOrCreateInitialState();
    const initialState = createInitialState();

    expect(result).toEqual(initialState);

    expect(prisma.simulationSave.create).toHaveBeenCalledWith({
        data: {
        cityId: "city-test-id",
        state: initialState,
        },
    });

    expect(prisma.simulationSave.update).not.toHaveBeenCalled();
    });

    
    it("avança o mês e salva o novo estado", async () => {
    const initialState = createInitialState();

    prisma.simulationSave.findFirst.mockResolvedValue({
        id: "save-test-id",
        cityId: "city-test-id",
        state: initialState,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    prisma.simulationSave.update.mockResolvedValue({});

    const result = await service.advanceCurrentMonth();

    expect(result.state.month).toBe(2);
    expect(result.state.year).toBe(1);

    expect(prisma.simulationSave.update).toHaveBeenCalledWith({
        where: { id: "save-test-id" },
        data: { state: result.state },
    });

    expect(prisma.simulationSave.create).not.toHaveBeenCalled();
    });
    
    it("executa uma ação válida e salva o novo estado", async () => {
    const initialState = createInitialState();

    prisma.simulationSave.findFirst.mockResolvedValue({
        id: "save-test-id",
        cityId: "city-test-id",
        state: initialState,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    prisma.simulationSave.update.mockResolvedValue({});

    const result = await service.performAction("expand-health-clinic");

    expect(result.success).toBe(true);
    expect(result.state.actionPoints).toBe(
        initialState.actionPoints - 1,
    );
    expect(result.state.budget.cash).toBe(
        initialState.budget.cash - 50_000,
    );
    expect(result.state.indicators.health).toBe(
        initialState.indicators.health + 2,
    );

    expect(prisma.simulationSave.update).toHaveBeenCalledWith({
        where: { id: "save-test-id" },
        data: { state: result.state },
    });

    expect(prisma.simulationSave.create).not.toHaveBeenCalled();
    });
    
  it("não salva o estado quando o caixa é insuficiente", async () => {
    const initialState = {
      ...createInitialState(),
      budget: {
        ...createInitialState().budget,
        cash: 20_000,
      },
    };

    prisma.simulationSave.findFirst.mockResolvedValue({
      id: "save-test-id",
      cityId: "city-test-id",
      state: initialState,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.performAction("expand-health-clinic");

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Era esperada uma falha na ação.");
    }

    expect(result.failureReason).toBe("INSUFFICIENT_FUNDS");
    expect(result.state).toEqual(initialState);
    expect(prisma.simulationSave.update).not.toHaveBeenCalled();
    expect(prisma.simulationSave.create).not.toHaveBeenCalled();
  });
  
  it("não salva o estado quando faltam Pontos de Ação", async () => {
    const initialState = {
      ...createInitialState(),
      actionPoints: 0,
    };

    prisma.simulationSave.findFirst.mockResolvedValue({
      id: "save-test-id",
      cityId: "city-test-id",
      state: initialState,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.performAction("expand-health-clinic");

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Era esperada uma falha na ação.");
    }

    expect(result.failureReason).toBe("INSUFFICIENT_ACTION_POINTS");
    expect(result.state).toEqual(initialState);
    expect(prisma.simulationSave.update).not.toHaveBeenCalled();
    expect(prisma.simulationSave.create).not.toHaveBeenCalled();
  });
});