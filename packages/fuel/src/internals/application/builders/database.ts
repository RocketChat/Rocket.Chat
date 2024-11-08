import type {
	DBCredentials,
	DBUrlCredentials,
	IDBConnectionReaderFactory,
	IDBDriver,
	IMongoDBInteractor,
	IMongoDBReaderInteractor,
} from '../../database';
import { MongoDBDriver, MongoDBConnectionReaderFactory } from '../../database';
import { FUEL_DI_TOKENS } from '../../dependency-injection';
import type { DependencyContainerManager } from '../../dependency-injection';

export class DatabaseBuilder {
	private instance: IDBDriver | undefined;

	constructor(private config: DBCredentials | DBUrlCredentials) {
		
	}

	public async start(dependencyContainer: DependencyContainerManager): Promise<void> {
		this.instance = new MongoDBDriver(
			dependencyContainer.resolveByToken(FUEL_DI_TOKENS.TRACING),
			dependencyContainer.resolveByToken(FUEL_DI_TOKENS.METRICS),
			dependencyContainer.resolveByToken(FUEL_DI_TOKENS.LOGGER),
		);
		if ('url' in this.config) {
			await this.instance.connectWithURL(this.config);
		} else {
			await this.instance.connectWithCredentials(this.config);
		}

		dependencyContainer.registerValueAsFunction<IDBConnectionReaderFactory>(
			FUEL_DI_TOKENS.DB_CONNECTION_READER_FACTORY,
			() =>
				new MongoDBConnectionReaderFactory(
					this.instance!.getIDBReaderInteractor(),
					dependencyContainer.resolveByToken(FUEL_DI_TOKENS.DEPENDENCY_CONTAINER_READER),
				),
		);
	}

	public getIDBInteractor(): IMongoDBInteractor {
		if (!this.instance) {
			throw new Error('Database must be started before retriving a DB Interactor');
		}
		return this.instance.getIDBInteractor();
	}

	public getIDBReaderInteractor(): IMongoDBReaderInteractor {
		if (!this.instance) {
			throw new Error('Database must be started before retriving a DB Reader Interactor');
		}
		return this.instance.getIDBReaderInteractor();
	}
}
