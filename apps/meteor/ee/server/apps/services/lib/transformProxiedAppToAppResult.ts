import type { ProxiedApp } from '@rocket.chat/apps-engine/server/ProxiedApp';
import type { AppsEngineAppResult } from '@rocket.chat/core-services';

export function transformProxiedAppToAppResult(app?: ProxiedApp): AppsEngineAppResult | undefined {
	if (!app) {
		return;
	}

	return {
		appId: app.getID(),
		currentStatus: app.getStatus(),
		storageItem: app.getStorageItem(),
	};
}
