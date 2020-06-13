import React, { useState, useEffect } from 'react';

import { useRouteParameter, useRoute, useCurrentRoute } from '../../contexts/RouterContext';
import { usePermission } from '../../contexts/AuthorizationContext';
import { Apps } from '../../../app/apps/client/orchestrator';
import AppProvider from './AppProvider';
import NotAuthorizedPage from '../NotAuthorizedPage';
import AppDetailsPage from './AppDetailsPage';
import MarketplacePage from './MarketplacePage';
import AppsPage from './AppsPage';
import AppLogsPage from './AppLogsPage';
import AppInstallPage from './AppInstallPage';
import PageSkeleton from '../PageSkeleton';

export default function AppsRoute() {
	const canViewAppsAndMarketplace = usePermission('manage-apps');
	const [isEnabled, setEnabled] = useState();

	const appsWhatIsItRouter = useRoute('admin-apps-disabled');

	const currentRoute = useCurrentRoute();

	const isMarketPlace = currentRoute[0] === 'admin-marketplace';

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const version = useRouteParameter('version');

	useEffect(() => {
		(async () => setEnabled(await Apps.isEnabled()))();
	}, []);

	if (!canViewAppsAndMarketplace) {
		return <NotAuthorizedPage />;
	}

	if (isEnabled === undefined) {
		return <PageSkeleton />;
	}

	if (!isEnabled) {
		appsWhatIsItRouter.push({});
	}

	return <AppProvider>
		{!context && isMarketPlace && <MarketplacePage />}
		{!context && !isMarketPlace && <AppsPage />}
		{context === 'details' && <AppDetailsPage id={id} marketplaceVersion={version}/>}
		{context === 'logs' && <AppLogsPage id={id}/>}
		{context === 'install' && <AppInstallPage />}
	</AppProvider>;
}
