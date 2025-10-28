import type { AppOverview } from './AppOverview';

export type FeaturedAppsSection = {
	i18nLabel: string;
	slug: string;
	apps: AppOverview[];
};
