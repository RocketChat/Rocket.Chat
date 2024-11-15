import type { AppManager } from '../AppManager';
import type { IParseAppPackageResult } from '../compiler';
import { DenoRuntimeSubprocessController } from '../runtime/deno/AppsEngineDenoRuntime';
import type { IAppStorageItem } from '../storage';
export type AppRuntimeParams = {
    appId: string;
    appSource: string;
};
export type ExecRequestContext = {
    method: string;
    params: unknown[];
};
export type ExecRequestOptions = {
    timeout?: number;
};
export declare class AppRuntimeManager {
    private readonly manager;
    private readonly subprocesses;
    constructor(manager: AppManager);
    startRuntimeForApp(appPackage: IParseAppPackageResult, storageItem: IAppStorageItem, options?: {
        force: boolean;
    }): Promise<DenoRuntimeSubprocessController>;
    runInSandbox(appId: string, execRequest: ExecRequestContext, options?: ExecRequestOptions): Promise<unknown>;
    stopRuntime(controller: DenoRuntimeSubprocessController): Promise<void>;
}
