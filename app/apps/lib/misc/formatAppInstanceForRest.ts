import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { AppLicenseValidationResult } from '@rocket.chat/apps-engine/server/marketplace/license';
import { ProxiedApp } from '@rocket.chat/apps-engine/server/ProxiedApp';
import { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';

export interface IAppInfoRest extends IAppInfo {
	status: AppStatus;
	languages: IAppStorageItem['languageContent'];
	licenseValidation?: AppLicenseValidationResult;
}

export function formatAppInstanceForRest(app: ProxiedApp): IAppInfoRest {
	const appRest: IAppInfoRest = {
		...app.getInfo(),
		status: app.getStatus(),
		languages: app.getStorageItem().languageContent,
	};

	if (appRest.status === AppStatus.INVALID_LICENSE_DISABLED) {
		appRest.licenseValidation = app.getLatestLicenseValidationResult();
	}

	return appRest;
}
