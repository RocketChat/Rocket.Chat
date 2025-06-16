import { createLogger } from '../utils/logger';
import * as dotenv from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getKeyPair } from '../keys';
import { injectable } from 'tsyringe';

const CONFIG_FOLDER = process.env.CONFIG_FOLDER || '.';

export interface AppConfig {
	server: {
		name: string;
		version: string;
		port: number;
		baseUrl: string;
		host: string;
	};

	database: {
		uri: string;
		name: string;
		poolSize: number;
	};

	matrix: {
		serverName: string;
		domain: string;
		keyRefreshInterval: number;
	};

	signingKey?: any;
	signingKeyPath?: string;
	path?: string;
}

@injectable()
export class ConfigService {
	private config: AppConfig;
	// private fileConfig: Partial<AppConfig> = {};
	private logger = createLogger('ConfigService');

	constructor() {
		this.loadEnvFiles();
		this.config = this.initializeConfig();
	}

	getConfig(): AppConfig {
		return this.config;
	}

	getServerConfig(): AppConfig['server'] {
		return this.config.server;
	}

	getDatabaseConfig(): AppConfig['database'] {
		return this.config.database;
	}

	getMatrixConfig(): AppConfig['matrix'] {
		return this.config.matrix;
	}

	async getSigningKey() {
		return this.loadSigningKey();
	}

	private loadEnvFiles(): void {
		const nodeEnv = process.env.NODE_ENV || 'development';

		const defaultEnvPath = path.resolve(process.cwd(), '.env');
		if (fs.existsSync(defaultEnvPath)) {
			dotenv.config({ path: defaultEnvPath });
		}

		const envSpecificPath = path.resolve(process.cwd(), `.env.${nodeEnv}`);
		if (fs.existsSync(envSpecificPath)) {
			dotenv.config({ path: envSpecificPath });
			this.logger.info(`Loaded configuration from .env.${nodeEnv}`);
		}

		const localEnvPath = path.resolve(process.cwd(), '.env.local');
		if (fs.existsSync(localEnvPath)) {
			dotenv.config({ path: localEnvPath });
			this.logger.info('Loaded configuration from .env.local');
		}
	}

	// private mergeConfigs(
	// 	baseConfig: AppConfig,
	// 	newConfig: Partial<AppConfig>,
	// ): AppConfig {
	// 	return {
	// 		...baseConfig,
	// 		...newConfig,
	// 		server: { ...baseConfig.server, ...newConfig.server },
	// 		database: { ...baseConfig.database, ...newConfig.database },
	// 		matrix: { ...baseConfig.matrix, ...newConfig.matrix },
	// 	};
	// }

	async loadSigningKey() {
		const signingKeyPath = `${CONFIG_FOLDER}/${this.config.server.name}.signing.key`;
		this.logger.info(`Loading signing key from ${signingKeyPath}`);

		try {
			const keys = await getKeyPair({ signingKeyPath });
			this.logger.info(
				`Successfully loaded signing key for server ${this.config.server.name}`,
			);
			return keys;
		} catch (error: any) {
			this.logger.error(`Failed to load signing key: ${error.message}`);
			throw error;
		}
	}

	private initializeConfig(): AppConfig {
		return {
			server: {
				name: process.env.SERVER_NAME || 'rc1',
				version: process.env.SERVER_VERSION || '1.0',
				port: this.getNumberFromEnv('SERVER_PORT', 8080),
				baseUrl: process.env.SERVER_BASE_URL || 'http://rc1:8080',
				host: process.env.SERVER_HOST || '0.0.0.0',
			},
			database: {
				uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/matrix',
				name: process.env.DATABASE_NAME || 'matrix',
				poolSize: this.getNumberFromEnv('DATABASE_POOL_SIZE', 10),
			},
			matrix: {
				serverName: process.env.MATRIX_SERVER_NAME || 'rc1',
				domain: process.env.MATRIX_DOMAIN || 'rc1',
				keyRefreshInterval: this.getNumberFromEnv(
					'MATRIX_KEY_REFRESH_INTERVAL',
					60,
				),
			},
		};
	}

	private getNumberFromEnv(key: string, defaultValue: number): number {
		return process.env[key] ? Number.parseInt(process.env[key]!) : defaultValue;
	}

	getServerName(): string {
		return this.config.server.name;
	}

	isDebugEnabled(): boolean {
		return process.env.DEBUG === 'true';
	}
}
