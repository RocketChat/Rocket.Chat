import React, { useState, useEffect } from 'react';

import { useRouteParameter, useRoute, use } from '../../contexts/RouterContext';
import { usePermission } from '../../contexts/AuthorizationContext';
import { Apps } from '../../../app/apps/client/orchestrator';
import AppProvider from './AppProvider';
import NotAuthorizedPage from '../NotAuthorizedPage';
import AppDetailsPage from './AppDetailsPage';
import MarketplacePage from './MarketplacePage';
import AppLogsPage from './AppLogsPage';
// import AppsWhatIsIt from './AppsWhatIsIt';
import PageSkeleton from '../PageSkeleton';

export default function AppsRoute() {
	const canViewAppsAndMarketplace = usePermission('manage-apps');
	const [isEnabled, setEnabled] = useState();

	const appsWhatIsItRouter = useRoute('admin-apps-disabled');

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
		{!context && <MarketplacePage />}
		{context === 'details' && <AppDetailsPage id={id} marketplaceVersion={version}/>}
		{context === 'logs' && <AppLogsPage id={id}/>}
	</AppProvider>;
}
