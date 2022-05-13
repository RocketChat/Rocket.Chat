import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import { PricingPlan } from './definitions/PricingPlan';

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
	categories: string[];
	version: string;
	price: number;
	purchaseType: string;
	pricingPlans: PricingPlan[];
	iconFileContent: string;
	installed?: boolean;
	isEnterpriseOnly?: boolean;
	bundledIn: {
		bundleId: string;
		bundleName: string;
		apps: App[];
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
