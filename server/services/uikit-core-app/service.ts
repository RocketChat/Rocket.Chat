import { ServiceClass } from '../../sdk/types/ServiceClass';
import { IUiKitCoreApp, IUiKitCoreAppService } from '../../sdk/types/IUiKitCoreApp';

const registeredApps = new Map();

const getService = (appId: string): any => {
	const service = registeredApps.get(appId);

	if (typeof service === 'undefined') {
		throw new Error('invalid service name');
	}


	return service;
};

export const registerCoreApp = (module: IUiKitCoreApp): void => {
	registeredApps.set(module.appId, module);
};

export class UiKitCoreApp extends ServiceClass implements IUiKitCoreAppService {
	protected name = 'uikit-core-app';

	async isRegistered(appId: string): Promise<boolean> {
		console.log('isRegistered', appId, registeredApps);
		return registeredApps.has(appId);
	}

	async blockAction(payload: any): Promise<any> {
		const { appId } = payload;

		const service = getService(appId);

		console.log('blockAction ->', payload);

		return service.blockAction(payload);
		// return { ok: true };
	}

	async viewClosed(payload: any): Promise<any> {
		console.log('viewClosed ->', payload);
		const { appId } = payload;

		const service = getService(appId);

		console.log('viewClosed ->', payload);

		return service.viewClosed(payload);
	}

	async viewSubmit(payload: any): Promise<any> {
		console.log('viewSubmit ->', payload);
		const { appId } = payload;

		const service = getService(appId);

		console.log('viewSubmit ->', payload);

		return service.viewSubmit(payload);
	}
}
