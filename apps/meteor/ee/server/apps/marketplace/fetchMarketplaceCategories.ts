import type { AppCategory } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { z } from 'zod';

import { getMarketplaceHeaders } from './getMarketplaceHeaders';
import { getWorkspaceAccessToken } from '../../../../app/cloud/server';
import { Apps } from '../orchestrator';
import { MarketplaceAppsError, MarketplaceConnectionError, MarketplaceUnsupportedVersionError } from './marketplaceErrors';

const fetchMarketplaceCategoriesSchema = z.array(
	z.object({
		id: z.string(),
		title: z.string(),
		description: z.string(),
		hidden: z.boolean(),
		createdDate: z.string(),
		modifiedDate: z.string(),
	}),
);

export async function fetchMarketplaceCategories(): Promise<AppCategory[]> {
	const baseUrl = Apps.getMarketplaceUrl();
	const headers = getMarketplaceHeaders();
	const token = await getWorkspaceAccessToken();
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	let request;
	try {
		request = await fetch(`${baseUrl}/v1/categories`, { headers });
	} catch (error) {
		throw new MarketplaceConnectionError('Marketplace_Bad_Marketplace_Connection');
	}

	if (request.status === 200) {
		const response = await request.json();
		fetchMarketplaceCategoriesSchema.parse(response);
		return response;
	}

	const response = await request.json();

	Apps.getRocketChatLogger().error('Failed to fetch marketplace categories', response);

	// TODO: Refactor cloud to return a proper error code on unsupported version
	if (request.status === 426 && 'errorMsg' in response && response.errorMsg === 'unsupported version') {
		throw new MarketplaceUnsupportedVersionError();
	}

	const INTERNAL_MARKETPLACE_ERROR_CODES = [189, 266];

	if (request.status === 500 && INTERNAL_MARKETPLACE_ERROR_CODES.includes(response.code)) {
		throw new MarketplaceAppsError('Marketplace_Internal_Error');
	}

	throw new MarketplaceAppsError('Marketplace_Failed_To_Fetch_Categories');
}
