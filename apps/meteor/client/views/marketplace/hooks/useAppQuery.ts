import type { App } from '@rocket.chat/core-typings';

import { useMarketplaceQueryWithContext } from './useMarketplaceQuery';

export const useAppQuery = (appId: App['id']) =>
	useMarketplaceQueryWithContext({
		select: (data) => {
			const app = data.find((app) => app.id === appId);

			if (!app) {
				throw new Error('App not found');
			}

			return app;
		},
	});
