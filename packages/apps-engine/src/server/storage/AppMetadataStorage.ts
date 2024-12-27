import type { IAppStorageItem } from './IAppStorageItem';

export abstract class AppMetadataStorage {
    constructor(private readonly engine: string) {}

    public getEngine() {
        return this.engine;
    }

    public abstract create(item: IAppStorageItem): Promise<IAppStorageItem>;

    public abstract retrieveOne(id: string): Promise<IAppStorageItem | null>;

    public abstract retrieveAll(): Promise<Map<string, IAppStorageItem>>;

    public abstract retrieveAllPrivate(): Promise<Map<string, IAppStorageItem>>;

    public abstract update(item: IAppStorageItem): Promise<IAppStorageItem>;

    public abstract remove(id: string): Promise<{ success: boolean }>;
}
