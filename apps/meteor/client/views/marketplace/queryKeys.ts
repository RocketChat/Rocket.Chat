import type { App } from '@rocket.chat/core-typings';

import type { MarketplaceContext } from './hooks/useMarketplaceContext';

export const marketplaceQueryKeys = {
	all: ['marketplace'] as const,
	categories: () => [...marketplaceQueryKeys.all, 'categories'] as const,
	featuredApps: () => [...marketplaceQueryKeys.all, 'featured-apps'] as const,
	appRequestStats: () => [...marketplaceQueryKeys.all, 'app-requests-stats'] as const,
	appsCount: () => [...marketplaceQueryKeys.all, 'apps-count'] as const,
	appsCountOnContext: (context: MarketplaceContext) => [...marketplaceQueryKeys.appsCount(), { context }] as const,
	appInfo: (app: App | undefined) => ['marketplace', 'apps', { app }] as const,
	apps: ({ canManageApps }: { canManageApps: boolean }) => ['marketplace', 'apps', { canManageApps }] as const,
	app: {
		self: (appId: App['id']) => [...marketplaceQueryKeys.all, 'apps', { appId }] as const,
		versions: (appId: App['id']) => [...marketplaceQueryKeys.app.self(appId), 'versions'] as const,
		screenshots: (appId: App['id']) => [...marketplaceQueryKeys.app.self(appId), 'screenshots'] as const,
		apis: (appId: App['id']) => [...marketplaceQueryKeys.app.self(appId), 'apis'] as const,
		logs: (appId: App['id']) => [...marketplaceQueryKeys.app.self(appId), 'logs'] as const,
		settings: (appId: App['id']) => [...marketplaceQueryKeys.app.self(appId), 'settings'] as const,
		requests: (appId: App['id'], { offset, limit }: { offset?: number; limit?: number }) =>
			[...marketplaceQueryKeys.app.self(appId), 'requests', { offset, limit }] as const,
		urls: {
			incompatible: (appId: App['id']) => [...marketplaceQueryKeys.app.self(appId), 'urls', 'incompatible'] as const,
			subscription: (appId: App['id']) => [...marketplaceQueryKeys.app.self(appId), 'urls', 'subscription'] as const,
			purchase: (appId: App['id']) => [...marketplaceQueryKeys.app.self(appId), 'urls', 'purchase'] as const,
		},
	},
};
