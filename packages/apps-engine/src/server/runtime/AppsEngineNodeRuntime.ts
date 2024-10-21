import * as timers from 'timers';
import * as vm from 'vm';

import type { App } from '../../definition/App';
import type { IAppsEngineRuntimeOptions } from './AppsEngineRuntime';
import { APPS_ENGINE_RUNTIME_DEFAULT_TIMEOUT, AppsEngineRuntime, getFilenameForApp } from './AppsEngineRuntime';

export class AppsEngineNodeRuntime extends AppsEngineRuntime {
    public static defaultRuntimeOptions = {
        timeout: APPS_ENGINE_RUNTIME_DEFAULT_TIMEOUT,
    };

    public static defaultContext = {
        ...timers,
        Buffer,
        console,
        process: {},
        exports: {},
    };

    public static async runCode(code: string, sandbox?: Record<string, any>, options?: IAppsEngineRuntimeOptions): Promise<any> {
        return new Promise((resolve, reject) => {
            process.nextTick(() => {
                try {
                    resolve(this.runCodeSync(code, sandbox, options));
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    public static runCodeSync(code: string, sandbox?: Record<string, any>, options?: IAppsEngineRuntimeOptions): any {
        return vm.runInNewContext(
            code,
            { ...AppsEngineNodeRuntime.defaultContext, ...sandbox },
            { ...AppsEngineNodeRuntime.defaultRuntimeOptions, ...(options || {}) },
        );
    }

    constructor(private readonly app: App, private readonly customRequire: (mod: string) => any) {
        super(app, customRequire);
    }

    public async runInSandbox(code: string, sandbox?: Record<string, any>, options?: IAppsEngineRuntimeOptions): Promise<any> {
        return new Promise((resolve, reject) => {
            process.nextTick(async () => {
                try {
                    sandbox ??= {};

                    const result = await vm.runInNewContext(
                        code,
                        {
                            ...AppsEngineNodeRuntime.defaultContext,
                            ...sandbox,
                            require: this.customRequire,
                        },
                        {
                            ...AppsEngineNodeRuntime.defaultRuntimeOptions,
                            filename: getFilenameForApp(options?.filename || this.app.getName()),
                        },
                    );

                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }
}
