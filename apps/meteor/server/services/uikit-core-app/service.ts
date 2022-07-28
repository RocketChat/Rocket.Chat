import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { IUiKitCoreApp, IUiKitCoreAppService } from '../../sdk/types/IUiKitCoreApp';

const registeredApps = new Map();

const getAppModule = (appId: string): any => {
	const module = registeredApps.get(appId);

	if (typeof module === 'undefined') {
		throw new Error('invalid service name');
	}

	return module;
};

export const registerCoreApp = (module: IUiKitCoreApp): void => {
	registeredApps.set(module.appId, module);
};

export class UiKitCoreApp extends ServiceClassInternal implements IUiKitCoreAppService {
	protected name = 'uikit-core-app';

	async isRegistered(appId: string): Promise<boolean> {
		return registeredApps.has(appId);
	}

	async blockAction(payload: any): Promise<any> {
		const { appId } = payload;

		const service = getAppModule(appId);
		if (!service) {
			return;
		}

		return service.blockAction?.(payload);
	}

	async viewClosed(payload: any): Promise<any> {
		const { appId } = payload;

		const service = getAppModule(appId);
		if (!service) {
			return;
		}

		return service.viewClosed?.(payload);
	}

	async viewSubmit(payload: any): Promise<any> {
		const { appId } = payload;

		const service = getAppModule(appId);
		if (!service) {
			return;
		}

		return service.viewSubmit?.(payload);
	}
}
