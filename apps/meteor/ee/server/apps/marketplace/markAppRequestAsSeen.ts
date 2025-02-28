import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { getMarketplaceHeaders } from './getMarketplaceHeaders';
import { getWorkspaceAccessToken } from '../../../../app/cloud/server';
import { Apps } from '../orchestrator';
import { MarketplaceAppsError, MarketplaceConnectionError } from './marketplaceErrors';

type MarkAppRequestAsSeenParams = {
	appIds: string[];
};

export async function markAppRequestAsSeen({ appIds }: MarkAppRequestAsSeenParams): Promise<void> {
	const baseUrl = Apps.getMarketplaceUrl();
	const headers = getMarketplaceHeaders();
	const token = await getWorkspaceAccessToken();
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	let request;
	try {
		request = await fetch(`${baseUrl}/v1/app-request/markAsSeen`, {
			method: 'POST',
			headers,
			body: { ids: appIds },
		});
	} catch (err) {
		throw new MarketplaceConnectionError('Marketplace_Bad_Marketplace_Connection');
	}

	if (request.ok) {
		return;
	}

	const response = await request.json();
	Apps.getRocketChatLogger().error('Error marking app request as seen', response);

	if (request.status === 426) {
		throw new MarketplaceAppsError('Marketplace_Workspace_Update_Required');
	}

	const INTERNAL_MARKETPLACE_ERROR_CODES = [266, 99999];
	if (INTERNAL_MARKETPLACE_ERROR_CODES.includes(response.code)) {
		throw new MarketplaceAppsError('Marketplace_Internal_Error');
	}

	throw new MarketplaceAppsError('Marketplace_Failed_To_Mark_App_Request_As_Seen');
}
