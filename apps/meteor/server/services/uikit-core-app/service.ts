import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IUiKitCoreApp, IUiKitCoreAppService, UiKitCoreAppPayload } from '@rocket.chat/core-services';

const registeredApps = new Map<string, IUiKitCoreApp>();

const getAppModule = (appId: string) => {
	const module = registeredApps.get(appId);

	if (typeof module === 'undefined') {
		throw new Error('invalid service name');
	}

	return module;
};

export const registerCoreApp = (module: IUiKitCoreApp): void => {
	registeredApps.set(module.appId, module);
};

export class UiKitCoreAppService extends ServiceClassInternal implements IUiKitCoreAppService {
	protected name = 'uikit-core-app';

	async isRegistered(appId: string): Promise<boolean> {
		return registeredApps.has(appId);
	}

	async blockAction(payload: UiKitCoreAppPayload) {
		const { appId } = payload;

		const service = getAppModule(appId);
		if (!service) {
			return;
		}

		return service.blockAction?.(payload);
	}

	async viewClosed(payload: UiKitCoreAppPayload) {
		const { appId } = payload;

		const service = getAppModule(appId);
		if (!service) {
			return;
		}

		return service.viewClosed?.(payload);
	}

	async viewSubmit(payload: UiKitCoreAppPayload) {
		const { appId } = payload;

		const service = getAppModule(appId);
		if (!service) {
			return;
		}

		return service.viewSubmit?.(payload);
	}
}
