import { createLogger } from '../utils/logger';
import { MongoClient, type MongoClientOptions, Db } from 'mongodb';
import { ConfigService } from './config.service';
import { injectable } from 'tsyringe';

@injectable()
export class DatabaseConnectionService {
	private client: MongoClient | null = null;
	private db: Db | null = null;
	private connectionPromise: Promise<void> | null = null;
	private readonly logger = createLogger('DatabaseConnectionService');

	constructor(private readonly configService: ConfigService) {
		this.connect().catch((err) =>
			this.logger.error(`Initial database connection failed: ${err.message}`),
		);
	}

	async getDb(): Promise<Db> {
		if (!this.db) {
			await this.connect();
		}

		if (!this.db) {
			throw new Error('Database connection not established');
		}

		return this.db;
	}

	private async connect(): Promise<void> {
		if (this.connectionPromise) {
			return this.connectionPromise;
		}

		if (this.client && this.db) {
			return;
		}

		this.connectionPromise = new Promise<void>((resolve, reject) => {
			try {
				const dbConfig = this.configService.getDatabaseConfig();

				const options: MongoClientOptions = {
					maxPoolSize: dbConfig.poolSize,
				};

				this.client = new MongoClient(dbConfig.uri, options);
				this.client.connect();

				this.db = this.client.db(dbConfig.name);
				this.logger.info(`Connected to MongoDB database: ${dbConfig.name}`);

				resolve();
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : String(error);
				this.logger.error(`Failed to connect to MongoDB: ${message}`);
				this.connectionPromise = null;
				reject(new Error('Database connection failed'));
			}
		});

		return this.connectionPromise;
	}

	async disconnect(): Promise<void> {
		if (this.client) {
			await this.client.close();
			this.client = null;
			this.db = null;
			this.connectionPromise = null;
			this.logger.info('Disconnected from MongoDB');
		}
	}
}
