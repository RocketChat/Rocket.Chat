import type { App } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { v, compile } from 'suretype';

import { getMarketplaceHeaders } from './getMarketplaceHeaders';
import { getWorkspaceAccessToken } from '../../../../app/cloud/server';
import { Apps } from '../orchestrator';
import { MarketplaceAppsError, MarketplaceConnectionError } from './marketplaceErrors';
import { appOverviewSchema } from './schema';

type FetchMarketplaceAppsParams = {
	endUserID?: string;
};

const fetchMarketplaceAppsSchema = v.array(appOverviewSchema);

const assertMarketplaceAppsSchema = compile(fetchMarketplaceAppsSchema);

export async function fetchMarketplaceApps({ endUserID }: FetchMarketplaceAppsParams = {}): Promise<App[]> {
	const baseUrl = Apps.getMarketplaceUrl();
	const headers = getMarketplaceHeaders();
	const token = await getWorkspaceAccessToken();
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	let request;
	try {
		request = await fetch(`${baseUrl}/v1/apps`, {
			headers,
			params: {
				...(endUserID && { endUserID }),
			},
		});
	} catch (error) {
		throw new MarketplaceConnectionError('Marketplace_Bad_Marketplace_Connection');
	}

	if (request.status === 200) {
		const response = await request.json();
		assertMarketplaceAppsSchema(response);
		return response;
	}

	const response = await request.json();

	Apps.getRocketChatLogger().error('Failed to fetch marketplace apps', response);

	if (request.status === 400 && response.code === 200) {
		throw new MarketplaceAppsError('Marketplace_Invalid_Apps_Engine_Version');
	}

	const INTERNAL_MARKETPLACE_ERROR_CODES = [266, 256, 166, 221, 257, 320];

	if (request.status === 500 && INTERNAL_MARKETPLACE_ERROR_CODES.includes(response.code)) {
		throw new MarketplaceAppsError('Marketplace_Internal_Error');
	}

	throw new MarketplaceAppsError('Marketplace_Failed_To_Fetch_Apps');
}
