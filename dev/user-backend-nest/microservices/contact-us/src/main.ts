import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const natsServers = (
    process.env.CONTACT_US_SERVICE_NATS_SERVERS || 'nats://localhost:4222'
  )
    .split(',')
    .map((server) => server.trim());
  Logger.log(`Using nats servers: ${natsServers}`);

  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.EXTENDED_LOGS === 'true'
        ? ['error', 'warn', 'log', 'debug', 'verbose']
        : ['error', 'warn', 'log'],
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: natsServers,
      queue: 'contact_us',
    },
  });
  await app.startAllMicroservices();

  const host = process.env.CONTACT_US_SERVICE_HOST || '127.0.0.1';
  const port = parseInt(process.env.CONTACT_US_SERVICE_PORT) || 3016;
  Logger.log(`Listening on host ${host}, port ${port}`);
  Logger.log(
    `Cache enabled. TTL: ${
      process.env.CONTACT_US_SERVICE_CACHE_TTL_MS || 300
    }ms`,
  );
  Logger.log(
    `Max cache entries: ${process.env.CONTACT_US_SERVICE_CACHE_MAX || 200}`,
  );
  await app.listen(port, host);
}
bootstrap();
