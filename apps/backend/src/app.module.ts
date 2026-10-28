
import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { SimulationController } from "./modules/simulation/simulation.controller";
import { SimulationService } from "./modules/simulation/simulation.service";

@Module({
  imports: [PrismaModule],
  controllers: [HealthController, SimulationController],
  providers: [SimulationService],
})
export class AppModule {}
