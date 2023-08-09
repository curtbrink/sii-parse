import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as bodyParser from "body-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.use(bodyParser.text({ limit: '50mb' }));
  await app.listen(35515);
}
bootstrap();
