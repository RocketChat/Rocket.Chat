import type { App } from '@rocket.chat/apps-engine/definition/App';

import type { IAppsEngineRuntimeOptions } from './AppsEngineRuntime';
import { AppsEngineRuntime } from './AppsEngineRuntime';

export class AppsEngineEmptyRuntime extends AppsEngineRuntime {
	public static async runCode(_code: string, _sandbox?: Record<string, any>, _options?: IAppsEngineRuntimeOptions): Promise<any> {
		throw new Error('Empty runtime does not support code execution');
	}

	public static runCodeSync(_code: string, _sandbox?: Record<string, any>, _options?: IAppsEngineRuntimeOptions): any {
		throw new Error('Empty runtime does not support code execution');
	}

	constructor(readonly app: App) {
		super(app, () => {});
	}

	public async runInSandbox(_code: string, _sandbox?: Record<string, any>, _options?: IAppsEngineRuntimeOptions): Promise<any> {
		return Promise.reject(new Error('Empty runtime does not support execution'));
	}
}
