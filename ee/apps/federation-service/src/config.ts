import { z } from 'zod';

const ConfigSchema = z.object({
  port: z.number().default(3030),
  host: z.string().default('0.0.0.0'),
  routePrefix: z.string().default('/federation'),
  rocketchatUrl: z.string().url().optional(),
  authMode: z.enum(['jwt', 'api-key', 'internal']).default('jwt'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
});

export type Config = z.infer<typeof ConfigSchema>;

export function isRunningMs(): boolean {
  return !!process.env.TRANSPORTER?.match(/^(?:nats|TCP)/);
}

export const config: Config = ConfigSchema.parse({
  port: parseInt(process.env.FEDERATION_SERVICE_PORT || '3030'),
  host: process.env.FEDERATION_SERVICE_HOST || '0.0.0.0',
  routePrefix: process.env.FEDERATION_ROUTE_PREFIX || '/_matrix',
  rocketchatUrl: process.env.ROCKETCHAT_URL,
  authMode: process.env.FEDERATION_AUTH_MODE as any || 'jwt',
  logLevel: process.env.LOG_LEVEL as any || 'info',
  nodeEnv: process.env.NODE_ENV as any || 'development',
});