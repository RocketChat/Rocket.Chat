import type { IMarketplacePricingPlan } from './IMarketplacePricingPlan';
import type { IMarketplaceSimpleBundleInfo } from './IMarketplaceSimpleBundleInfo';
import type { IMarketplaceSubscriptionInfo } from './IMarketplaceSubscriptionInfo';
import type { MarketplacePurchaseType } from './MarketplacePurchaseType';
import type { IAppInfo } from '../../definition/metadata';

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
