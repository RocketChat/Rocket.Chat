import type { ILoggerStorageEntry } from '../logging';

export interface IAppLogStorageFindOptions {
    sort?: { [field: string]: number };
    skip?: number;
    limit?: number;
    fields?: { [field: string]: number };
}

export abstract class AppLogStorage {
    constructor(private readonly engine: string) {}

    public getEngine() {
        return this.engine;
    }

    public abstract find(query: { [field: string]: any }, options?: IAppLogStorageFindOptions): Promise<Array<ILoggerStorageEntry>>;

    public abstract storeEntries(logEntry: ILoggerStorageEntry): Promise<ILoggerStorageEntry>;

    public abstract getEntriesFor(appId: string): Promise<Array<ILoggerStorageEntry>>;

    public abstract removeEntriesFor(appId: string): Promise<void>;
}
