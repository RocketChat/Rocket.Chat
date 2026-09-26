import { Inject, Injectable } from '@nestjs/common';
import type { SettingValue } from '@rocket.chat/core-typings';
import {
  type CoreServices,
  InjectCoreService,
} from '../broker/core-services.js';
import { SHADOW_CONFIG, type ShadowConfig } from '../config/shadow.config.js';

interface CachedSetting {
  value: SettingValue;
  expiresAt: number;
}

// Reads workspace settings from the settings service. A short cache keeps the
// hot paths to one broker round trip per setting in each TTL window.
@Injectable()
export class SettingsService {
  private readonly cache = new Map<string, CachedSetting>();

  constructor(
    @InjectCoreService('Settings')
    private readonly settings: CoreServices['Settings'],
    @Inject(SHADOW_CONFIG) private readonly config: ShadowConfig,
  ) {}

  async get<T extends SettingValue>(settingId: string): Promise<T> {
    const cached = this.cache.get(settingId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const value = await this.settings.get<T>(settingId);
    this.cache.set(settingId, {
      value,
      expiresAt: Date.now() + this.config.settingsCacheTtlMs,
    });

    return value;
  }
}
