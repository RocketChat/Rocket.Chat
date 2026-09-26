export interface ShadowConfig {
  port: number;
  mongoUrl: string;
  settingsCacheTtlMs: number;
}

export const SHADOW_CONFIG = Symbol('SHADOW_CONFIG');

export function shadowConfigFromEnv(env = process.env): ShadowConfig {
  return {
    port: Number(env.PORT ?? 3300),
    mongoUrl: env.MONGO_URL ?? 'mongodb://localhost:27017/rocketchat',
    settingsCacheTtlMs: Number(env.SETTINGS_CACHE_TTL_MS ?? 5000),
  };
}
