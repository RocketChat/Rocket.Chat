import React, { useState, useEffect } from 'react';

import { useRouteParameter, useRoute } from '../../contexts/RouterContext';
import { usePermission } from '../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../NotAuthorizedPage';
import PageSkeleton from '../PageSkeleton';
import AppDetailsPage from './AppDetailsPage';
import AppProvider from './AppProvider';
import AppLogsPage from './AppLogsPage';
import MarketplacePage from './MarketplacePage';
import { useMethod } from '../../contexts/ServerContext';

export default function AppsRoute() {
	const [isLoading, setLoading] = useState(true);
	const canViewAppsAndMarketplace = usePermission('manage-apps');
	const isAppsEngineEnabled = useMethod('apps/is-enabled');
	const appsWhatIsItRoute = useRoute('admin-apps-disabled');

	useEffect(() => {
		let mounted = true;

		const initialize = async () => {
			if (!canViewAppsAndMarketplace) {
				return;
			}

			if (!await isAppsEngineEnabled()) {
				appsWhatIsItRoute.push();
				return;
			}

			if (!mounted) {
				return;
			}

			setLoading(false);
		};

		initialize();

		return () => {
			mounted = false;
		};
	}, [canViewAppsAndMarketplace, isAppsEngineEnabled, appsWhatIsItRoute]);

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const version = useRouteParameter('version');

	if (!canViewAppsAndMarketplace) {
		return <NotAuthorizedPage />;
	}

	if (isLoading) {
		return <PageSkeleton />;
	}

	return <AppProvider>
		{!context && <MarketplacePage />}
		{context === 'details' && <AppDetailsPage id={id} marketplaceVersion={version}/>}
		{context === 'logs' && <AppLogsPage id={id}/>}
	</AppProvider>;
}
