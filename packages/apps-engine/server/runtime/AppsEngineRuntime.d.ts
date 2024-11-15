import type { App } from '../../definition/App';
export declare const APPS_ENGINE_RUNTIME_DEFAULT_TIMEOUT = 1000;
export declare const APPS_ENGINE_RUNTIME_FILE_PREFIX = "$RocketChat_App$";
export declare function getFilenameForApp(filename: string): string;
export declare abstract class AppsEngineRuntime {
    static runCode(code: string, sandbox?: Record<string, any>, options?: IAppsEngineRuntimeOptions): Promise<any>;
    static runCodeSync(code: string, sandbox?: Record<string, any>, options?: IAppsEngineRuntimeOptions): any;
    constructor(app: App, customRequire: (module: string) => any);
    abstract runInSandbox(code: string, sandbox?: Record<string, any>, options?: IAppsEngineRuntimeOptions): Promise<any>;
}
export interface IAppsEngineRuntimeOptions {
    timeout?: number;
    filename?: string;
    returnAllExports?: boolean;
}
