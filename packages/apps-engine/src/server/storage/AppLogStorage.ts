import type { ILoggerStorageEntry } from '../logging';

export interface IAppLogStorageFindOptions {
	sort?: Record<string, 1 | -1>;
	skip?: number;
	limit?: number;
	projection?: Record<string, 1 | 0>;
}

export abstract class AppLogStorage {
	constructor(private readonly engine: string) {}

	public getEngine() {
		return this.engine;
	}

	public abstract find(
		query: { [field: string]: any },
		options?: IAppLogStorageFindOptions,
	): Promise<{ logs: ILoggerStorageEntry[]; total: number }>;

	public abstract storeEntries(logEntry: ILoggerStorageEntry): Promise<ILoggerStorageEntry>;

	public abstract getEntriesFor(appId: string): Promise<Array<ILoggerStorageEntry>>;

	public abstract removeEntriesFor(appId: string): Promise<void>;
}
