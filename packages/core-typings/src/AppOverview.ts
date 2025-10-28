import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import type { App, AppSubscriptionStatus } from './Apps';

export type AppOverview = {
	appId: string;
	latest: Latest;
	isAddon: boolean;
	addonId: string;
	isEnterpriseOnly: boolean;
	isBundle: boolean;
	bundledAppIds: any[];
	bundledIn: bundledIn[];
	isPurchased: boolean;
	isSubscribed: boolean;
	subscriptionInfo: SubscriptionInfo;
	price: number;
	purchaseType: string;
	pricingPlans: PricingPlan[];
	isUsageBased: boolean;
	createdAt: string;
	modifiedAt: string;
	iconFileContent?: string;
	marketplaceVersion?: string;
	marketplace?: unknown;
};

export type bundledIn = {
	bundleId: string;
	bundleName: string;
	apps: App[];
	addonTierId: string;
};

export type Latest = {
	internalId: string;
	id: string;
	name: string;
	nameSlug: string;
	version: string;
	categories: string[];
	languages: string[];
	description: string;
	privacyPolicySummary: string;
	detailedDescription: DetailedDescription;
	detailedChangelog: DetailedChangelog;
	requiredApiVersion: string;
	permissions: Permission[];
	author: Author;
	classFile: string;
	iconFile: string;
	iconFileData: string;
	status: AppStatus;
	isVisible: boolean;
	createdDate: string;
	modifiedDate: string;
	isPurchased: boolean;
	isSubscribed: boolean;
	subscriptionInfo: SubscriptionInfo;
	compileJobId: string;
	compiled: boolean;
	tosLink: string;
	privacyLink: string;
};

export type DetailedDescription = {
	raw: string;
	rendered: string;
};

export type DetailedChangelog = {
	raw: string;
	rendered: string;
};

export type Permission = {
	name: string;
	scopes?: string[];
};

export type Author = {
	name: string;
	support: string;
	homepage: string;
};

export type SubscriptionInfo = {
	typeOf: string;
	status: AppSubscriptionStatus;
	statusFromBilling: boolean;
	isSeatBased: boolean;
	seats: number;
	maxSeats: number;
	license: License;
	startDate: string;
	periodEnd: string;
	endDate: string;
	externallyManaged: boolean;
	isSubscribedViaBundle: boolean;
};

export type License = {
	license: string;
	version: number;
	expireDate: string;
};

export type PricingPlan = {
	id: string;
	enabled: boolean;
	price: number;
	trialDays: number;
	strategy: string;
	isPerSeat: boolean;
};
