import type { AppManager } from '../AppManager';
import type { IParseAppPackageResult } from '../compiler';
import type { IRuntimeController } from '../runtime/IRuntimeController';
import { NodeRuntimeSubprocessController } from '../runtime/node/AppsEngineNodeRuntime';
import { WattRuntimeController } from '../runtime/watt/WattRuntimeController';
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

export type RuntimeFactory = (
	manager: AppManager,
	appPackage: IParseAppPackageResult,
	storageItem: IAppStorageItem,
) => IRuntimeController;

/**
 * Default runtime: one Node `child_process` per app, supervised by the
 * LivenessManager.
 */
export const nodeRuntimeFactory: RuntimeFactory = (manager, appPackage, storageItem) =>
	new NodeRuntimeSubprocessController(manager, appPackage, storageItem);

/**
 * Opt-in runtime: every app runs as an application inside a single, shared
 * Platformatic Watt runtime (one Worker Thread per app), with liveness, restarts
 * and metrics handled by Watt instead of the LivenessManager.
 *
 * Requires the optional `@platformatic/runtime` dependency to be installed.
 */
export const wattRuntimeFactory: RuntimeFactory = (manager, appPackage, storageItem) =>
	new WattRuntimeController(manager, appPackage, storageItem);

const defaultRuntimeFactory: RuntimeFactory = nodeRuntimeFactory;

export class AppRuntimeManager {
	private readonly subprocesses: Record<string, IRuntimeController> = {};

	constructor(
		private readonly manager: AppManager,
		private readonly runtimeFactory = defaultRuntimeFactory,
	) {}

	public async startRuntimeForApp(
		appPackage: IParseAppPackageResult,
		storageItem: IAppStorageItem,
		options = { force: false },
	): Promise<IRuntimeController> {
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

	public async stopRuntime(controller: IRuntimeController): Promise<void> {
		await controller.stopApp();

		const appId = controller.getAppId();

		if (appId in this.subprocesses) {
			delete this.subprocesses[appId];
		}
	}
}
