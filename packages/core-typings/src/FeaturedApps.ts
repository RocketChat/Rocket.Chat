import type { App } from './Apps';

export type FeaturedAppsSections = {
	sections: FeaturedAppsSection[];
};

export type FeaturedAppsSection = {
	i18nLabel: string;
	slug: string;
	apps: App[];
};
