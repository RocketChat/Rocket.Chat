import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { ProxiedApp } from '@rocket.chat/apps-engine/server/ProxiedApp';
import type { AppLicenseValidationResult } from '@rocket.chat/apps-engine/server/marketplace/license';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';

import { getInstallationSourceFromAppStorageItem } from '../../../lib/apps/getInstallationSourceFromAppStorageItem';

interface IAppInfoRest extends IAppInfo {
	status: AppStatus;
	languages: IAppStorageItem['languageContent'];
	licenseValidation?: AppLicenseValidationResult;
	private: boolean;
	migrated: boolean;
}

export async function formatAppInstanceForRest(app: ProxiedApp): Promise<IAppInfoRest> {
	const appRest: IAppInfoRest = {
		...app.getInfo(),
		status: await app.getStatus(),
		languages: app.getStorageItem().languageContent,
		private: getInstallationSourceFromAppStorageItem(app.getStorageItem()) === 'private',
		migrated: !!app.getStorageItem().migrated,
	};

	const licenseValidation = app.getLatestLicenseValidationResult();

	if (licenseValidation?.hasErrors || licenseValidation?.hasWarnings) {
		appRest.licenseValidation = licenseValidation;
	}

	return appRest;
}
