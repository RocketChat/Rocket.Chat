import { z } from 'zod';

const markdownObject = z.object({
	raw: z.string(),
	rendered: z.string(),
});

export const appOverviewSchema = z.object({
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
});
