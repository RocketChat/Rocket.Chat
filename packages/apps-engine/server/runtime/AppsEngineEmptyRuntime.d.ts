import type { IAppsEngineRuntimeOptions } from './AppsEngineRuntime';
import { AppsEngineRuntime } from './AppsEngineRuntime';
import type { App } from '../../definition/App';
export declare class AppsEngineEmptyRuntime extends AppsEngineRuntime {
    readonly app: App;
    static runCode(code: string, sandbox?: Record<string, any>, options?: IAppsEngineRuntimeOptions): Promise<any>;
    static runCodeSync(code: string, sandbox?: Record<string, any>, options?: IAppsEngineRuntimeOptions): any;
    constructor(app: App);
    runInSandbox(code: string, sandbox?: Record<string, any>, options?: IAppsEngineRuntimeOptions): Promise<any>;
}
