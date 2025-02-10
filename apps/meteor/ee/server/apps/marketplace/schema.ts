import { v } from 'suretype';

const markdownObject = {
	raw: v.string(),
	rendered: v.string(),
};

export const appOverviewSchema = v.object({
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
});
