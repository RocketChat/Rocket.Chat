import type { AppRequestStats } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { v, compile } from 'suretype';

import { getMarketplaceHeaders } from './getMarketplaceHeaders';
import { getWorkspaceAccessToken } from '../../../../app/cloud/server';
import { Apps } from '../orchestrator';
import { MarketplaceAppsError, MarketplaceConnectionError } from './marketplaceErrors';

const marketplaceAppRequestStatsResponseSchema = v.object({
	data: v
		.object({
			totalSeen: v.number().required(),
			totalUnseen: v.number().required(),
		})
		.required(),
});

const assertMarketplaceAppRequestStatsResponse = compile(marketplaceAppRequestStatsResponseSchema);

export async function fetchAppRequestsStats(): Promise<AppRequestStats> {
	const baseUrl = Apps.getMarketplaceUrl();
	const headers = getMarketplaceHeaders();
	const token = await getWorkspaceAccessToken();
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	let request;
	try {
		request = await fetch(`${baseUrl}/v1/app-request/stats`, { headers });
	} catch (err) {
		throw new MarketplaceConnectionError('Marketplace_Bad_Marketplace_Connection');
	}

	if (request.status === 200) {
		const response = await request.json();
		assertMarketplaceAppRequestStatsResponse(response);
		return response;
	}

	const response = await request.json();

	Apps.getRocketChatLogger().error('Failed to fetch marketplace apps', response);

	if (request.status === 426) {
		throw new MarketplaceAppsError('Marketplace_Update_Required');
	}

	const INTERNAL_MARKETPLACE_ERROR_CODES = [266, 99999];
	if (request.status === 500 && INTERNAL_MARKETPLACE_ERROR_CODES.includes(response.code)) {
		throw new MarketplaceAppsError('Marketplace_Internal_Error');
	}

	throw new MarketplaceAppsError('Marketplace_Failed_To_Fetch_Apps_Request_Stats');
}
