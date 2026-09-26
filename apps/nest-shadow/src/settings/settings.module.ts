import { Global, Module } from '@nestjs/common';
import { SettingsService } from './settings.service.js';

@Global()
@Module({
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
