
import {
  Controller,
  Get,
  ServiceUnavailableException,
} from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  check() {
    return {
      status: "ok",
      application: "The Governor",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("database")
  async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: "error",
        database: "disconnected",
      });
    }
  }
}