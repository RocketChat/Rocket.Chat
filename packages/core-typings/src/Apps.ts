import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

export type AppScreenshot = {
	id: string;
	appId: string;
	fileName: string;
	accessUrl: string;
	thumbnailUrl: string;
	createdAt: string;
	modifiedAt: string;
};

export type PricingPlan = {
	id: string;
	enabled: boolean;
	price: number;
	trialDays: number;
	strategy: string;
	isPerSeat: boolean;
	tiers?: Tiers[];
};

export type Tiers = {
	perUnit: boolean;
	minimum: number;
	maximum: number;
	price: number;
};

export type App = {
	id: string;
	iconFileData: string;
	name: string;
	author: {
		name: string;
		homepage: string;
		support: string;
	};
	description: string;
	detailedDescription: {
		raw: string;
		rendered: string;
	};
	categories: string[];
	version: string;
	price: number;
	purchaseType: string;
	pricingPlans: PricingPlan[];
	iconFileContent: string;
	installed?: boolean;
	isEnterpriseOnly?: boolean;
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
	licenseValidation?: {
		errors: { [key: string]: string };
		warnings: { [key: string]: string };
	};
	marketplace: unknown;
	modifiedAt: string;
	permissions: unknown[];
};
