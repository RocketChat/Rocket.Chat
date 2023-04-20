import type { AppFabricationFulfillment as AppsEngineAppFabricationFulfillment } from '@rocket.chat/apps-engine/server/compiler';
import type { AppFabricationFulfillment, AppsEngineAppResult } from '@rocket.chat/core-services';

import { transformProxiedAppToAppResult } from './transformProxiedAppToAppResult';

export function transformAppFabricationFulfillment(fulfillment: AppsEngineAppFabricationFulfillment): AppFabricationFulfillment {
	return {
		appId: fulfillment.getApp().getID(),
		appsEngineResult: transformProxiedAppToAppResult(fulfillment.getApp()) as AppsEngineAppResult,
		licenseValidationResult: {
			errors: fulfillment.getLicenseValidationResult().getErrors() as Record<string, string>,
			warnings: fulfillment.getLicenseValidationResult().getWarnings() as Record<string, string>,
		},
		storageError: fulfillment.getStorageError(),
		appUserError: fulfillment.getAppUserError() as { username: string; message: string },
	};
}
