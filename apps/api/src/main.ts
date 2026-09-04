import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
  });

  // The shell's environment beats .env (dotenv never overwrites an exported var):
  // some terminals/harnesses export PORT=0 or an ephemeral port, which would make
  // the API unreachable at the fixed :3001 the Vite proxy targets. Coerce to a
  // number and fall back to the documented default (see README "Troubleshooting").
  const port = Number(configService.get<string>('PORT')) || 3001;
  await app.listen(port);
  console.log(`🚀 API server running on http://localhost:${port}/api/v1`);
}
bootstrap();