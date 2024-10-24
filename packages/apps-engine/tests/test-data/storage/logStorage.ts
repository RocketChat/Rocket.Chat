import type { ILoggerStorageEntry } from '../../../src/server/logging';
import type { IAppLogStorageFindOptions } from '../../../src/server/storage';
import { AppLogStorage } from '../../../src/server/storage';

export class TestsAppLogStorage extends AppLogStorage {
    constructor() {
        super('nothing');
    }

    public find(query: { [field: string]: any }, options?: IAppLogStorageFindOptions): Promise<Array<ILoggerStorageEntry>> {
        return Promise.resolve([]);
    }

    public storeEntries(logEntry: ILoggerStorageEntry): Promise<ILoggerStorageEntry> {
        return Promise.resolve({} as ILoggerStorageEntry);
    }

    public getEntriesFor(appId: string): Promise<Array<ILoggerStorageEntry>> {
        return Promise.resolve([]);
    }

    public removeEntriesFor(appId: string): Promise<void> {
        return Promise.resolve();
    }
}
