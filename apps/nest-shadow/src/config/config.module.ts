import { Global, Module } from '@nestjs/common';
import { SHADOW_CONFIG, shadowConfigFromEnv } from './shadow.config.js';

@Global()
@Module({
  providers: [
    { provide: SHADOW_CONFIG, useFactory: () => shadowConfigFromEnv() },
  ],
  exports: [SHADOW_CONFIG],
})
export class ConfigModule {}
