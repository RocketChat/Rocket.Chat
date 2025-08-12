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

const defaultRuntimeFactory = (manager: AppManager, appPackage: IParseAppPackageResult, storageItem: IAppStorageItem) =>
	new DenoRuntimeSubprocessController(manager, appPackage, storageItem);

export class AppRuntimeManager {
	private readonly subprocesses: Record<string, DenoRuntimeSubprocessController> = {};

	constructor(
		private readonly manager: AppManager,
		private readonly runtimeFactory = defaultRuntimeFactory,
	) {}

	public async startRuntimeForApp(
		appPackage: IParseAppPackageResult,
		storageItem: IAppStorageItem,
		options = { force: false },
	): Promise<DenoRuntimeSubprocessController> {
		const { id: appId } = appPackage.info;

		if (appId in this.subprocesses && !options.force) {
			throw new Error('App already has an associated runtime');
		}

		this.subprocesses[appId] = this.runtimeFactory(this.manager, appPackage, storageItem);

		try {
			await this.subprocesses[appId].setupApp();
		} catch (error) {
			const subprocess = this.subprocesses[appId];
			delete this.subprocesses[appId];
			await subprocess.stopApp();
			throw error;
		}

		return this.subprocesses[appId];
	}

	public async runInSandbox(appId: string, execRequest: ExecRequestContext, options?: ExecRequestOptions): Promise<unknown> {
		const subprocess = this.subprocesses[appId];

		if (!subprocess) {
			throw new Error('App does not have an associated runtime');
		}

		return subprocess.sendRequest(execRequest);
	}

	public async stopRuntime(controller: DenoRuntimeSubprocessController): Promise<void> {
		await controller.stopApp();

		const appId = controller.getAppId();

		if (appId in this.subprocesses) {
			delete this.subprocesses[appId];
		}
	}
}
