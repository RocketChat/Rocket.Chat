import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import type { ExternalModuleName } from './license';

export type AppScreenshot = {
	id: string;
	appId: string;
	fileName: string;
	accessUrl: string;
	thumbnailUrl: string;
	createdAt: string;
	modifiedAt: string;
};

export type AppTiers = {
	perUnit: boolean;
	minimum: number;
	maximum: number;
	price: number;
};

export type AppPricingPlan = {
	id: string;
	enabled: boolean;
	price: number;
	trialDays: number;
	strategy: string;
	isPerSeat: boolean;
	tiers?: AppTiers[];
};

export type AppLicense = {
	license: string;
	version: number;
	expireDate: string;
};

export enum AppSubscriptionStatus {
	Trialing = 'trialing',
	Active = 'active',
	Cancelled = 'cancelled',
	Cancelling = 'cancelling',
	PastDue = 'pastDue',
}

export type AppSubscriptionInfo = {
	typeOf: string;
	status: AppSubscriptionStatus;
	statusFromBilling: boolean;
	isSeatBased: boolean;
	seats: number;
	maxSeats: number;
	license: AppLicense;
	startDate: string;
	periodEnd: string;
	endDate: string;
	isSubscribedViaBundle: boolean;
};

export type AppPermission = {
	name: string;
	required?: boolean;
};

export type PurchaseType = 'buy' | 'subscription';

export type AppRequestStats = {
	appId: string;
	totalSeen: number;
	totalUnseen: number;
};

export type App = {
	id: string;
	iconFileData: string;
	name: string;
	appRequestStats: AppRequestStats;
	author: {
		name: string;
		homepage: string;
		support: string;
	};
	description: string;
	shortDescription?: string;
	privacyPolicySummary: string;
	detailedDescription: {
		raw: string;
		rendered: string;
	};
	detailedChangelog: {
		raw: string;
		rendered: string;
	};
	categories: string[];
	version: string;
	versionIncompatible?: boolean;
	addon?: ExternalModuleName;
	installedAddon?: ExternalModuleName;
	price: number;
	purchaseType: PurchaseType;
	pricingPlans: AppPricingPlan[];
	iconFileContent: string;
	installed?: boolean;
	isEnterpriseOnly?: boolean;
	isPurchased?: boolean;
	isSubscribed: boolean;
	bundledIn: {
		bundleId: string;
		bundleName: string;
		apps: App[];
		addonTierId?: string;
	}[];
	marketplaceVersion: string;
	latest: App;
	status?: AppStatus;
	subscriptionInfo: AppSubscriptionInfo;
	licenseValidation?: {
		errors: { [key: string]: string };
		warnings: { [key: string]: string };
	};
	tosLink: string;
	privacyLink: string;
	marketplace?: unknown;
	modifiedAt: string;
	permissions: AppPermission[];
	languages: string[];
	createdDate: string;
	requestedEndUser?: boolean;
	private: boolean;
	documentationUrl: string;
	migrated: boolean;
};

export type AppCategory = {
	id: string;
	title: string;
	description: string;
	hidden: boolean;
	createdDate: string;
	modifiedDate: string;
};
