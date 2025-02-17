import type { IAppStorageItem } from './IAppStorageItem';
export declare abstract class AppMetadataStorage {
    private readonly engine;
    constructor(engine: string);
    getEngine(): string;
    abstract create(item: IAppStorageItem): Promise<IAppStorageItem>;
    abstract retrieveOne(id: string): Promise<IAppStorageItem | null>;
    abstract retrieveAll(): Promise<Map<string, IAppStorageItem>>;
    abstract retrieveAllPrivate(): Promise<Map<string, IAppStorageItem>>;
    abstract update(item: IAppStorageItem): Promise<IAppStorageItem>;
    abstract remove(id: string): Promise<{
        success: boolean;
    }>;
}
