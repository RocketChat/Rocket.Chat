import type { App } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { z } from 'zod';

import { getMarketplaceHeaders } from './getMarketplaceHeaders';
import { getWorkspaceAccessToken } from '../../../../app/cloud/server';
import { Apps } from '../orchestrator';
import { MarketplaceAppsError, MarketplaceConnectionError, MarketplaceUnsupportedVersionError } from './marketplaceErrors';

type FetchMarketplaceAppsParams = {
	endUserID?: string;
};

const markdownObject = z.object({
	raw: z.string().optional(),
	rendered: z.string().optional(),
});

const fetchMarketplaceAppsSchema = z.array(
	z.object({
		appId: z.string(),
		latest: z.object({
			internalId: z.string(),
			id: z.string(),
			name: z.string(),
			nameSlug: z.string(),
			version: z.string(),
			categories: z.array(z.string()),
			languages: z.array(z.string()).optional(),
			shortDescription: z.string().optional(),
			description: z.string(),
			privacyPolicySummary: z.string().optional(),
			documentationUrl: z.string().optional(),
			detailedDescription: markdownObject,
			detailedChangelog: markdownObject,
			requiredApiVersion: z.string(),
			versionIncompatible: z.boolean().optional(),
			permissions: z
				.array(
					z.object({
						name: z.string(),
						domains: z.array(z.string()).optional(),
						scopes: z.array(z.string()).optional(),
					}),
				)
				.optional(),
			addon: z.string().optional(),
			author: z.object({
				name: z.string(),
				support: z.string(),
				homepage: z.string(),
			}),
			classFile: z.string(),
			iconFile: z.string(),
			iconFileData: z.string(),
			status: z.enum(['submitted', 'author-rejected', 'author-approved', 'rejected', 'approved', 'published']),
			reviewedNote: z.string().optional(),
			rejectionNote: z.string().optional(),
			changesNote: z.string().optional(),
			internalChangesNote: z.string().optional(),
			isVisible: z.boolean(),
			createdDate: z.string(),
			modifiedDate: z.string(),
		}),
		isAddon: z.boolean(),
		addonId: z.string().optional(),
		isEnterpriseOnly: z.boolean(),
		isBundle: z.boolean(),
		bundledAppsIn: z.array(z.string()).optional(),
		bundledIn: z.array(
			z.object({
				bundleId: z.string(),
				bundleName: z.string(),
				addonTierId: z.string().optional(),
			}),
		),
		isPurchased: z.boolean(),
		isSubscribed: z.boolean(),
		subscriptionInfo: z
			.object({
				typeOf: z.enum(['app', 'service', '']),
				status: z.enum(['trialing', 'active', 'cancelled', 'cancelling', 'pastDue', '']),
				statusFromBilling: z.boolean(),
				isSeatBased: z.boolean(),
				seats: z.number(),
				maxSeats: z.number(),
				license: z.object({
					license: z.string(),
					version: z.number(),
					expireDate: z.string(),
				}),
				startDate: z.string(),
				periodEnd: z.string(),
				endDate: z.string().optional(),
				externallyManaged: z.boolean(),
				isSubscribedViaBundle: z.boolean(),
			})
			.optional(),
		price: z.number(),
		purchaseType: z.enum(['', 'buy', 'subscription']),
		pricingPlans: z
			.array(
				z.object({
					id: z.string(),
					enabled: z.boolean(),
					price: z.number(),
					trialDays: z.number(),
					strategy: z.enum(['once', 'monthly', 'yearly']),
					isPerSeat: z.boolean(),
					tiers: z
						.array(
							z.object({
								perUnit: z.boolean(),
								minimum: z.number(),
								maximum: z.number(),
								price: z.number(),
								refId: z.string().optional(),
							}),
						)
						.optional(),
				}),
			)
			.optional(),
		isUsageBased: z.boolean().optional(),
		requestedEndUser: z.boolean().optional(),
		requested: z.boolean().optional(),
		appRequestStats: z.object({}).optional(),
		createdAt: z.string(),
		modifiedAt: z.string(),
	}),
);

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
		fetchMarketplaceAppsSchema.parse(response);
		return response;
	}

	const response = await request.json();

	Apps.getRocketChatLogger().error('Failed to fetch marketplace apps', response);

	// TODO: Refactor cloud to return a proper error code on unsupported version
	if (request.status === 426 && 'errorMsg' in response && response.errorMsg === 'unsupported version') {
		throw new MarketplaceUnsupportedVersionError();
	}

	if (request.status === 400 && response.code === 200) {
		throw new MarketplaceAppsError('Marketplace_Invalid_Apps_Engine_Version');
	}

	const INTERNAL_MARKETPLACE_ERROR_CODES = [266, 256, 166, 221, 257, 320];

	if (request.status === 500 && INTERNAL_MARKETPLACE_ERROR_CODES.includes(response.code)) {
		throw new MarketplaceAppsError('Marketplace_Internal_Error');
	}

	throw new MarketplaceAppsError('Marketplace_Failed_To_Fetch_Apps');
}
