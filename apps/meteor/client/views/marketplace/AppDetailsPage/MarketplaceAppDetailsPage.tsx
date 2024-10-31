import type { App } from '@rocket.chat/core-typings';
import React from 'react';

import { useAppDetailsPageTab } from '../hooks/useAppDetailsPageTab';
import AppDetailsPageHeader from './AppDetailsPageHeader';
import AppDetailsPageLayout from './AppDetailsPageLayout';
import AppDetailsPageTabs from './AppDetailsPageTabs';
import AppDetails from './tabs/AppDetails';
import AppReleases from './tabs/AppReleases';
import AppRequests from './tabs/AppRequests/AppRequests';
import AppSecurity from './tabs/AppSecurity/AppSecurity';

type MarketplaceAppDetailsPageProps = {
	app: App;
};

const MarketplaceAppDetailsPage = ({ app }: MarketplaceAppDetailsPageProps) => {
	const [tab] = useAppDetailsPageTab();

	return (
		<AppDetailsPageLayout>
			<AppDetailsPageHeader app={app} />
			<AppDetailsPageTabs app={app} />
			{tab === 'details' && <AppDetails app={app} />}
			{tab === 'requests' && <AppRequests appId={app.id} />}
			{tab === 'security' && <AppSecurity app={app} />}
			{tab === 'releases' && <AppReleases appId={app.id} />}
		</AppDetailsPageLayout>
	);
};

export default MarketplaceAppDetailsPage;
