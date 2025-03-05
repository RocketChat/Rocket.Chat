import type { FeaturedAppsSection } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { z } from 'zod';

import { Apps } from '../orchestrator';
import { getMarketplaceHeaders } from './getMarketplaceHeaders';
import { MarketplaceAppsError, MarketplaceConnectionError } from './marketplaceErrors';
import { appOverviewSchema } from './schema';
import { getWorkspaceAccessToken } from '../../../../app/cloud/server';

const marketplaceFeaturedAppsSchema = z.object({
	sections: z.array(
		z.object({
			i18nLabel: z.string(),
			slug: z.string(),
			apps: z.array(appOverviewSchema),
		}),
	),
});

export async function fetchMarketplaceFeaturedApps(): Promise<{ sections: FeaturedAppsSection[] }> {
	const baseUrl = Apps.getMarketplaceUrl();
	const headers = getMarketplaceHeaders();
	const token = await getWorkspaceAccessToken();
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	let request;
	try {
		request = await fetch(`${baseUrl}/v1/featured-apps`, { headers });
	} catch (error) {
		throw new MarketplaceConnectionError('Marketplace_Bad_Marketplace_Connection');
	}

	if (request.status === 200) {
		const response = await request.json();
		marketplaceFeaturedAppsSchema.parse(response);
		return response;
	}

	const response = await request.json();
	Apps.getRocketChatLogger().error('Failed to fetch marketplace featured apps', response);

	if (request.status === 400 && response.code === 200) {
		throw new MarketplaceAppsError('Marketplace_Invalid_Apps_Engine_Version');
	}

	const INTERNAL_MARKETPLACE_ERROR_CODES = [266, 999999];
	if (request.status === 500 && INTERNAL_MARKETPLACE_ERROR_CODES.includes(response.code)) {
		throw new MarketplaceAppsError('Marketplace_Internal_Error');
	}

	throw new MarketplaceAppsError('Marketplace_Failed_To_Fetch_Featured_Apps');
}
