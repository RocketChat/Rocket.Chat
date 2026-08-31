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

export type AppPricingPlan = {
	id: string;
	enabled: boolean;
	price: number;
	trialDays: number;
	strategy: string;
	isPerSeat: boolean;
	tiers?: {
		perUnit: boolean;
		minimum: number;
		maximum: number;
		price: number;
	}[];
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
	license: {
		license: string;
		version: number;
		expireDate: string;
	};
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
	// Status of the app across the cluster (when deployment includes multiple instances)
	clusterStatus?: {
		instanceId: string;
		status: AppStatus;
	}[];
};

export type AppCategory = {
	id: string;
	title: string;
	description: string;
	hidden: boolean;
	createdDate: string;
	modifiedDate: string;
};

export type AppOverview = {
	appId: string;
	latest: {
		internalId: string;
		id: string;
		name: string;
		nameSlug: string;
		version: string;
		categories: string[];
		languages: string[];
		description: string;
		privacyPolicySummary: string;
		detailedDescription: {
			raw: string;
			rendered: string;
		};
		detailedChangelog: {
			raw: string;
			rendered: string;
		};
		requiredApiVersion: string;
		permissions: {
			name: string;
			scopes?: string[];
		}[];
		author: {
			name: string;
			support: string;
			homepage: string;
		};
		classFile: string;
		iconFile: string;
		iconFileData: string;
		status: AppStatus;
		isVisible: boolean;
		createdDate: string;
		modifiedDate: string;
		isPurchased: boolean;
		isSubscribed: boolean;
		subscriptionInfo: AppSubscriptionInfo & { externallyManaged: boolean };
		compileJobId: string;
		compiled: boolean;
		tosLink: string;
		privacyLink: string;
	};
	isAddon: boolean;
	addonId: string;
	isEnterpriseOnly: boolean;
	isBundle: boolean;
	bundledAppIds: any[];
	bundledIn: {
		bundleId: string;
		bundleName: string;
		apps: App[];
		addonTierId: string;
	}[];
	isPurchased: boolean;
	isSubscribed: boolean;
	subscriptionInfo: AppSubscriptionInfo & { externallyManaged: boolean };
	price: number;
	purchaseType: string;
	pricingPlans: {
		id: string;
		enabled: boolean;
		price: number;
		trialDays: number;
		strategy: string;
		isPerSeat: boolean;
	}[];
	isUsageBased: boolean;
	createdAt: string;
	modifiedAt: string;
	iconFileContent?: string;
	marketplaceVersion?: string;
	marketplace?: unknown;
};

export type FeaturedAppsSection = {
	i18nLabel: string;
	slug: string;
	apps: AppOverview[];
};

export type AppRequestFilter = 'unseen' | 'seen' | 'notification-sent' | 'notification-not-sent' | '';

type AppRequestEndUser = {
	id: string;
	username: string;
	name: string;
	nickname: string;
	emails: string[];
};

export type AppRequest = {
	id: string;
	appId: string;

	requester: AppRequestEndUser;
	admins: AppRequestEndUser[];

	workspaceId: string;
	message: string;

	seen: boolean;
	seenAt: string;
	notificationSent: boolean;
	notificationSentAt: string;

	createdDate: string;
};
