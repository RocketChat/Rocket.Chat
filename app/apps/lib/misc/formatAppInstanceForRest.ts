import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { AppLicenseValidationResult } from '@rocket.chat/apps-engine/server/marketplace/license';
import { ProxiedApp } from '@rocket.chat/apps-engine/server/ProxiedApp';

export interface IAppInfoRest extends IAppInfo {
	status: AppStatus;
	licenseValidation: AppLicenseValidationResult;
}

export function formatAppInstanceForRest(app: ProxiedApp): IAppInfoRest {
	return {
		...app.getInfo(),
		status: app.getStatus(),
		licenseValidation: app.getLatestLicenseValidationResult(),
	};
}
