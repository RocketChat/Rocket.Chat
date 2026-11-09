import type { IAppLicenseMetadata } from './IAppLicenseMetadata.js';
import type { MarketplaceSubscriptionStatus } from './MarketplaceSubscriptionStatus.js';
import type { MarketplaceSubscriptionType } from './MarketplaceSubscriptionType.js';

export interface IMarketplaceSubscriptionInfo {
	seats: number;
	maxSeats: number;
	startDate: string;
	periodEnd: string;
	isSubscripbedViaBundle: boolean;
	endDate?: string;
	typeOf: MarketplaceSubscriptionType;
	status: MarketplaceSubscriptionStatus;
	license: IAppLicenseMetadata;
}
