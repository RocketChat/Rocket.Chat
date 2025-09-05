export type Config = {
	port: number;
	host: string;
	routePrefix: string;
	rocketchatUrl: string;
	authMode: 'jwt' | 'api-key' | 'internal';
	logLevel: 'debug' | 'info' | 'warn' | 'error';
	nodeEnv: 'development' | 'production' | 'test';
};

export function isRunningMs(): boolean {
	return !!process.env.TRANSPORTER?.match(/^(?:nats|TCP)/);
}

export const config = {
	port: parseInt(process.env.FEDERATION_SERVICE_PORT || '3030'),
	host: process.env.FEDERATION_SERVICE_HOST || '0.0.0.0',
	routePrefix: process.env.FEDERATION_ROUTE_PREFIX || '/_matrix',
	rocketchatUrl: process.env.ROCKETCHAT_URL || '',
	authMode: (process.env.FEDERATION_AUTH_MODE as any) || 'jwt',
	logLevel: (process.env.LOG_LEVEL as any) || 'info',
	nodeEnv: (process.env.NODE_ENV as any) || 'development',
};
