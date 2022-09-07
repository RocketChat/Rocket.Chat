import { App } from '@rocket.chat/core-typings';
import type { AppOverview } from '@rocket.chat/core-typings';

const normalizeFeaturedApps = (appOverviewList: AppOverview[], appsResultItems: App[]): App[] => {
	const featuredAppsIdList = appOverviewList.map<string>((featuredApp) => featuredApp.latest.id);

	return appsResultItems.filter((app) => featuredAppsIdList.includes(app.id));
};

export default normalizeFeaturedApps;
