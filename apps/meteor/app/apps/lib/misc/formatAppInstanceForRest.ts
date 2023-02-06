import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { AppLicenseValidationResult } from '@rocket.chat/apps-engine/server/marketplace/license';
import type { ProxiedApp } from '@rocket.chat/apps-engine/server/ProxiedApp';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';

export interface IAppInfoRest extends IAppInfo {
	status: AppStatus;
	languages: IAppStorageItem['languageContent'];
	licenseValidation?: AppLicenseValidationResult;
	private: boolean;
}

export function formatAppInstanceForRest(app: ProxiedApp): IAppInfoRest {
	const appRest: IAppInfoRest = {
		...app.getInfo(),
		status: app.getStatus(),
		languages: app.getStorageItem().languageContent,
		private: !app.getStorageItem().marketplaceInfo,
	};

	const licenseValidation = app.getLatestLicenseValidationResult();

	if (licenseValidation.hasErrors || licenseValidation.hasWarnings) {
		appRest.licenseValidation = licenseValidation;
	}

	return appRest;
}
