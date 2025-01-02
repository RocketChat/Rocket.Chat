import type { App } from '@rocket.chat/core-typings';

import { useMarketplaceQuery } from './useMarketplaceQuery';

export const useAppQuery = (appId: App['id']) =>
	useMarketplaceQuery({
		select: (data) => {
			const app =
				data.private.find((app) => app.id === appId) ??
				data.installed.find((app) => app.id === appId) ??
				data.marketplace.find((app) => app.id === appId);

			if (!app) {
				throw new Error('App not found');
			}

			return app;
		},
	});
