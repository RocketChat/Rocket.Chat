export type MarketplaceRouteContext = 'private' | 'explore' | 'installed' | 'premium' | 'requested' | 'details';

export function isMarketplaceRouteContext(context: string): context is MarketplaceRouteContext {
	return ['private', 'explore', 'installed', 'premium', 'requested'].includes(context);
}
