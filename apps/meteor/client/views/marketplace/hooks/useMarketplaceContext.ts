import { useRouteParameter } from '@rocket.chat/ui-contexts';

export type MarketplaceContext = 'explore' | 'installed' | 'premium' | 'private' | 'requested';

export const useMarketplaceContext = (): MarketplaceContext => {
	const context = useRouteParameter('context');

	switch (context) {
		case 'explore':
		case 'installed':
		case 'premium':
		case 'private':
		case 'requested':
			return context;

		default:
			return 'explore';
	}
};
