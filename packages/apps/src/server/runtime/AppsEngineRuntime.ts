import type { App } from '@rocket.chat/apps-engine/definition/App';

export const APPS_ENGINE_RUNTIME_DEFAULT_TIMEOUT = 1000;

export const APPS_ENGINE_RUNTIME_FILE_PREFIX = '$RocketChat_App$';

export function getFilenameForApp(filename: string): string {
	return `${APPS_ENGINE_RUNTIME_FILE_PREFIX}_${filename}`;
}

export abstract class AppsEngineRuntime {
	public static async runCode(_code: string, _sandbox?: Record<string, any>, _options?: IAppsEngineRuntimeOptions): Promise<any> {
		throw new Error(`Can't call this method on abstract class. Override it in a proper runtime class.`);
	}

	public static runCodeSync(_code: string, _sandbox?: Record<string, any>, _options?: IAppsEngineRuntimeOptions): any {
		throw new Error(`Can't call this method on abstract class. Override it in a proper runtime class.`);
	}

	constructor(_app: App, _customRequire: (module: string) => any) {}

	public abstract runInSandbox(code: string, sandbox?: Record<string, any>, options?: IAppsEngineRuntimeOptions): Promise<any>;
}

export interface IAppsEngineRuntimeOptions {
	timeout?: number;
	filename?: string;
	returnAllExports?: boolean;
}
