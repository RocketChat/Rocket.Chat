import type { IMarketplacePricingTier } from './IMarketplacePricingTier';
import type { MarketplacePricingStrategy } from './MarketplacePricingStrategy';

export interface IMarketplacePricingPlan {
    id: string;
    enabled: boolean;
    price: number;
    isPerSeat: boolean;
    strategy: MarketplacePricingStrategy;
    tiers?: Array<IMarketplacePricingTier>;
}
