import type { IMarketplaceInfo } from '@rocket.chat/apps-engine/server/marketplace';
import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import { API } from '../../../../app/api/server';
import { getMarketplaceAppInfo } from './appInfo';
import type { Logger } from '../../../../server/lib/logger/Logger';

export const appEnableCheck = async ({
	baseUrl,
	headers,
	appId,
	version,
	marketplaceInfo,
	logger,
	status,
}: {
	baseUrl: string;
	headers: Record<string, any>;
	appId: string;
	version: string;
	marketplaceInfo: IMarketplaceInfo;
	logger: Logger;
	status: AppStatus;
}) => {
	let isAppEnterpriseOnly = !!marketplaceInfo.isEnterpriseOnly;

	const appInfosURL = new URL(`${baseUrl}/v1/apps/${appId}`);
	appInfosURL.searchParams.set('appVersion', String(version));

	try {
		const { isEnterpriseOnly } = await getMarketplaceAppInfo({ baseUrl, headers, appId, version });

		if (isEnterpriseOnly) {
			isAppEnterpriseOnly = isEnterpriseOnly;
		}
	} catch (error: any) {
		logger.error('Error getting the app info from the Marketplace:', error.message);
		return API.v1.failure(error.message);
	}

	if (![AppStatus.DISABLED, AppStatus.MANUALLY_DISABLED].includes(status) && isAppEnterpriseOnly) {
		return API.v1.failure('Invalid environment for enabling enterprise app');
	}
};
