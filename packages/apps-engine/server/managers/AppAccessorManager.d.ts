import type { IConfigurationExtend, IConfigurationModify, IEnvironmentRead, IEnvironmentWrite, IHttp, IModify, IPersistence, IRead } from '../../definition/accessors';
import type { AppManager } from '../AppManager';
export declare class AppAccessorManager {
    private readonly manager;
    private readonly bridges;
    private readonly configExtenders;
    private readonly envReaders;
    private readonly envWriters;
    private readonly configModifiers;
    private readonly readers;
    private readonly modifiers;
    private readonly persists;
    private readonly https;
    constructor(manager: AppManager);
    /**
     * Purifies the accessors for the provided App.
     *
     * @param appId The id of the App to purge the accessors for.
     */
    purifyApp(appId: string): void;
    getConfigurationExtend(appId: string): IConfigurationExtend;
    getEnvironmentRead(appId: string): IEnvironmentRead;
    getEnvironmentWrite(appId: string): IEnvironmentWrite;
    getConfigurationModify(appId: string): IConfigurationModify;
    getReader(appId: string): IRead;
    getModifier(appId: string): IModify;
    getPersistence(appId: string): IPersistence;
    getHttp(appId: string): IHttp;
}
