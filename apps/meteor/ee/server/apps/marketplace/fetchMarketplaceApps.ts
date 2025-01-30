import type { App } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { v, compile } from 'suretype';

import { getMarketplaceHeaders } from './getMarketplaceHeaders';
import { getWorkspaceAccessToken } from '../../../../app/cloud/server';
import { Apps } from '../orchestrator';
import { MarketplaceAppsError, MarketplaceConnectionError } from './marketplaceErrors';

type FetchMarketplaceAppsParams = {
	endUserID?: string;
};

const markdownObject = {
	raw: v.string(),
	rendered: v.string(),
};

const fetchMarketplaceAppsSchema = v.array(
	v.object({
		appId: v.string().required(),
		latest: v
			.object({
				internalId: v.string(),
				id: v.string().required(),
				name: v.string().required(),
				nameSlug: v.string().required(),
				version: v.string().required(),
				categories: v.array(v.string()).required(),
				languages: v.array(v.string()),
				shortDescription: v.string(),
				description: v.string().required(),
				privacyPolicySummary: v.string(),
				documentationUrl: v.string(),
				detailedDescription: v.object(markdownObject).required(),
				detailedChangelog: v.object(markdownObject).required(),

				requiredApiVersion: v.string().required(),
				versionIncompatible: v.boolean(),

				permissions: v.array(
					v.object({
						name: v.string().required(),
						domains: v.array(v.string()),
						scopes: v.array(v.string()),
					}),
				),
				addon: v.string(),
				author: v
					.object({
						name: v.string().required(),
						support: v.string().required(),
						homepage: v.string().required(),
					})
					.required(),
				classFile: v.string().required(),
				iconFile: v.string().required(),
				iconFileData: v.string().required(),
				status: v.string().enum('submitted', 'author-rejected', 'author-approved', 'rejected', 'approved').required(),
				reviewedNote: v.string(),
				rejectionNote: v.string(),
				changesNote: v.string(),
				internalChangesNote: v.string(),
				isVisible: v.boolean().required(),
				createdDate: v.string().required(),
				modifiedDate: v.string().required(),
			})
			.required(),
		isAddon: v.boolean().required(),
		addonId: v.string(),
		isEnterpriseOnly: v.boolean().required(),
		isBundle: v.boolean().required(),
		bundedAppIds: v.array(v.string()).required(),
		bundledIn: v
			.array(
				v.object({
					bundleId: v.string(),
					bundleName: v.string(),
					addonTierId: v.string(),
				}),
			)
			.required(),
		isPurchased: v.boolean().required(),
		isSubscribed: v.boolean().required(),
		subscriptionInfo: v.object({
			typeOf: v.string().enum('app', 'service').required(),
			status: v.string().enum('trialing', 'active', 'cancelled', 'cancelling', 'pastDue').required(),
			statusFromBilling: v.boolean().required(),
			isSeatBased: v.boolean().required(),
			seats: v.number().required(),
			maxSeats: v.number().required(),
			license: v
				.object({
					license: v.string().required(),
					version: v.number().required(),
					expireDate: v.string().required(),
				})
				.required(),
			startDate: v.string().required(),
			periodEnd: v.string().required(),
			endDate: v.string(),
			externallyManaged: v.boolean().required(),
			isSubscribedViaBundle: v.boolean().required(),
		}),
		price: v.number().required(),
		purchaseType: v.string().enum('', 'buy', 'subscription').required(),
		pricingPlans: v.array(
			v.object({
				id: v.string().required(),
				enabled: v.boolean().required(),
				price: v.number().required(),
				trialDays: v.number().required(),
				strategy: v.string().enum('once', 'monthly', 'yearly').required(),
				isPerSeat: v.boolean().required(),
				tiers: v.array(
					v.object({
						perUnit: v.boolean().required(),
						minimum: v.number().required(),
						maximum: v.number().required(),
						price: v.number().required(),
						refId: v.string(),
					}),
				),
			}),
		),
		isUsageBased: v.boolean().required(),

		requestedEndUser: v.boolean(),
		requested: v.boolean(),
		appRequestStats: v.object({}),

		createdAt: v.string().required(),
		modifiedAt: v.string().required(),
	}),
);

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
