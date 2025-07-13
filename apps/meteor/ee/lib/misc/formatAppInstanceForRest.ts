import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { ProxiedApp } from '@rocket.chat/apps-engine/server/ProxiedApp';
import type { AppLicenseValidationResult } from '@rocket.chat/apps-engine/server/marketplace/license';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import type { AppStatusReport } from '@rocket.chat/core-services';
import type { App } from '@rocket.chat/core-typings';

import { getInstallationSourceFromAppStorageItem } from '../../../lib/apps/getInstallationSourceFromAppStorageItem';

interface IAppInfoRest extends IAppInfo {
	status: AppStatus;
	languages: IAppStorageItem['languageContent'];
	licenseValidation?: AppLicenseValidationResult;
	private: boolean;
	migrated: boolean;
	clusterStatus?: App['clusterStatus'];
}

export async function formatAppInstanceForRest(app: ProxiedApp, clusterStatus?: AppStatusReport): Promise<IAppInfoRest> {
	const appRest: IAppInfoRest = {
		...app.getInfo(),
		status: await app.getStatus(),
		languages: app.getStorageItem().languageContent,
		private: getInstallationSourceFromAppStorageItem(app.getStorageItem()) === 'private',
		migrated: !!app.getStorageItem().migrated,
	};

	if (clusterStatus?.[app.getID()]) {
		appRest.clusterStatus = clusterStatus[app.getID()];
	}

	const licenseValidation = app.getLatestLicenseValidationResult();

	if (licenseValidation?.hasErrors || licenseValidation?.hasWarnings) {
		appRest.licenseValidation = licenseValidation;
	}

	return appRest;
}
