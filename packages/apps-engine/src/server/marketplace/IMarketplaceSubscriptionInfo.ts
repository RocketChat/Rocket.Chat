import type { IAppLicenseMetadata } from './IAppLicenseMetadata';
import type { MarketplaceSubscriptionStatus } from './MarketplaceSubscriptionStatus';
import type { MarketplaceSubscriptionType } from './MarketplaceSubscriptionType';

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
