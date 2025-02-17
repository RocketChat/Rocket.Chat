import type { IAppsEngineRuntimeOptions } from './AppsEngineRuntime';
import { AppsEngineRuntime } from './AppsEngineRuntime';
import type { App } from '../../definition/App';
export declare class AppsEngineNodeRuntime extends AppsEngineRuntime {
    private readonly app;
    private readonly customRequire;
    static defaultRuntimeOptions: {
        timeout: number;
    };
    static defaultContext: {
        Buffer: BufferConstructor;
        console: Console;
        process: {};
        exports: {};
        setTimeout: typeof global.setTimeout;
        clearTimeout: typeof global.clearTimeout;
        setInterval: typeof global.setInterval;
        clearInterval: typeof global.clearInterval;
        setImmediate: typeof global.setImmediate;
        clearImmediate: typeof global.clearImmediate;
    };
    static runCode(code: string, sandbox?: Record<string, any>, options?: IAppsEngineRuntimeOptions): Promise<any>;
    static runCodeSync(code: string, sandbox?: Record<string, any>, options?: IAppsEngineRuntimeOptions): any;
    constructor(app: App, customRequire: (mod: string) => any);
    runInSandbox(code: string, sandbox?: Record<string, any>, options?: IAppsEngineRuntimeOptions): Promise<any>;
}
