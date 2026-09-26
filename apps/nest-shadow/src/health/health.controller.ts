import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import type { IBroker } from '@rocket.chat/core-services';
import { BROKER } from '../broker/broker.module.js';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(@Inject(BROKER) private readonly broker: IBroker) {}

  @Get()
  async check(): Promise<{ status: 'ok' }> {
    try {
      await this.broker.nodeList();
    } catch {
      throw new ServiceUnavailableException('not healthy');
    }

    return { status: 'ok' };
  }
}
