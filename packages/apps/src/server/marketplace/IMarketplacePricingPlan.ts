import type { IMarketplacePricingTier } from './IMarketplacePricingTier.js';
import type { MarketplacePricingStrategy } from './MarketplacePricingStrategy.js';

export interface IMarketplacePricingPlan {
	id: string;
	enabled: boolean;
	price: number;
	isPerSeat: boolean;
	strategy: MarketplacePricingStrategy;
	tiers?: Array<IMarketplacePricingTier>;
}
