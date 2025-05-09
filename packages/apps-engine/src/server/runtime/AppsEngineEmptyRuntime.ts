import type { IAppsEngineRuntimeOptions } from './AppsEngineRuntime';
import { AppsEngineRuntime } from './AppsEngineRuntime';
import type { App } from '../../definition/App';

export class AppsEngineEmptyRuntime extends AppsEngineRuntime {
    public static async runCode(code: string, sandbox?: Record<string, any>, options?: IAppsEngineRuntimeOptions): Promise<any> {
        throw new Error('Empty runtime does not support code execution');
    }

    public static runCodeSync(code: string, sandbox?: Record<string, any>, options?: IAppsEngineRuntimeOptions): any {
        throw new Error('Empty runtime does not support code execution');
    }

    constructor(readonly app: App) {
        super(app, () => {});
    }

    public async runInSandbox(code: string, sandbox?: Record<string, any>, options?: IAppsEngineRuntimeOptions): Promise<any> {
        return Promise.reject(new Error('Empty runtime does not support execution'));
    }
}
