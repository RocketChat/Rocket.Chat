import type { App } from '../../definition/App';

export const APPS_ENGINE_RUNTIME_DEFAULT_TIMEOUT = 1000;

export const APPS_ENGINE_RUNTIME_FILE_PREFIX = '$RocketChat_App$';

export function getFilenameForApp(filename: string): string {
    return `${APPS_ENGINE_RUNTIME_FILE_PREFIX}_${filename}`;
}

export abstract class AppsEngineRuntime {
    public static async runCode(code: string, sandbox?: Record<string, any>, options?: IAppsEngineRuntimeOptions): Promise<any> {
        throw new Error(`Can't call this method on abstract class. Override it in a proper runtime class.`);
    }

    public static runCodeSync(code: string, sandbox?: Record<string, any>, options?: IAppsEngineRuntimeOptions): any {
        throw new Error(`Can't call this method on abstract class. Override it in a proper runtime class.`);
    }

    constructor(app: App, customRequire: (module: string) => any) {}

    public abstract runInSandbox(code: string, sandbox?: Record<string, any>, options?: IAppsEngineRuntimeOptions): Promise<any>;
}

export interface IAppsEngineRuntimeOptions {
    timeout?: number;
    filename?: string;
    returnAllExports?: boolean;
}
