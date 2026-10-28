
import {
  Body,
  Controller,
  Get,
  Post,
} from "@nestjs/common";
import { SimulationService } from "./simulation.service";

@Controller("simulation")
export class SimulationController {
  constructor(
    private readonly simulationService: SimulationService,
  ) {}

  @Get()
    async getSimulation() {
      const { state, lastReport } =
        await this.simulationService.loadSimulationData();

      return {
        state,
        report: lastReport,
      };
    }

  @Post("advance")
  async advanceMonth() {
    return this.simulationService.advanceCurrentMonth();
  }

  @Post("actions")
  async performAction(@Body() body: { actionId: string }) {
    return this.simulationService.performAction(body.actionId);
  }
}
