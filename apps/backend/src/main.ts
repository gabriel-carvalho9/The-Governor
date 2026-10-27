import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix("api");

  await app.listen(process.env.PORT ?? 3000);

  console.log("The Governor API disponível em http://localhost:3000/api");
}

bootstrap();
