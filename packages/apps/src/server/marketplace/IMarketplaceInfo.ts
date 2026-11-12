import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata/index.js';

import type { IMarketplacePricingPlan } from './IMarketplacePricingPlan.js';
import type { IMarketplaceSimpleBundleInfo } from './IMarketplaceSimpleBundleInfo.js';
import type { IMarketplaceSubscriptionInfo } from './IMarketplaceSubscriptionInfo.js';
import type { MarketplacePurchaseType } from './MarketplacePurchaseType.js';

export interface IMarketplaceInfo extends IAppInfo {
	categories: Array<string>;
	status: string;
	reviewedNote?: string;
	rejectionNote?: string;
	isVisible: boolean;
	isPurchased: boolean;
	isSubscribed: boolean;
	isBundled: boolean;
	createdDate: string;
	modifiedDate: string;
	price: number;
	subscriptionInfo?: IMarketplaceSubscriptionInfo;
	purchaseType: MarketplacePurchaseType;
	pricingPlans?: Array<IMarketplacePricingPlan>;
	bundledIn?: Array<IMarketplaceSimpleBundleInfo>;
	isEnterpriseOnly?: boolean;
}
