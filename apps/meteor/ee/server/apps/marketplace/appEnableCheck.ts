import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IMarketplaceInfo } from '@rocket.chat/apps-engine/server/marketplace';

import type { Logger } from '../../../../server/lib/logger/Logger';
import { getMarketplaceAppInfo } from './appInfo';

export const appEnableCheck = async ({
	baseUrl,
	headers,
	appId,
	version,
	logger,
	status,
	marketplaceInfo,
}: {
	baseUrl: string;
	headers: Record<string, any>;
	appId: string;
	version: string;
	logger: Logger;
	status: AppStatus;
	marketplaceInfo?: IMarketplaceInfo;
}) => {
	let isAppEnterpriseOnly = false;

	if (marketplaceInfo?.isEnterpriseOnly !== undefined) {
		isAppEnterpriseOnly = marketplaceInfo.isEnterpriseOnly;
	} else {
		try {
			const { isEnterpriseOnly } = await getMarketplaceAppInfo({ baseUrl, headers, appId, version });

			isAppEnterpriseOnly = !!isEnterpriseOnly;
		} catch (error: any) {
			logger.error('Error getting the app info from the Marketplace:', error.message);
			throw new Error(error.message);
		}
	}

	if (![AppStatus.DISABLED, AppStatus.MANUALLY_DISABLED].includes(status) && isAppEnterpriseOnly) {
		throw new Error('Invalid environment for enabling enterprise app');
	}
};
