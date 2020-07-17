import React, { useState, useEffect } from 'react';

import { usePermission } from '../../contexts/AuthorizationContext';
import { useRouteParameter, useRoute, useCurrentRoute } from '../../contexts/RouterContext';
import { useMethod } from '../../contexts/ServerContext';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import PageSkeleton from '../PageSkeleton';
import AppDetailsPage from './AppDetailsPage';
import MarketplacePage from './MarketplacePage';
import AppsPage from './AppsPage';
import AppInstallPage from './AppInstallPage';
import AppProvider from './AppProvider';
import AppLogsPage from './AppLogsPage';

function AppsRoute() {
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

	const [currentRouteName] = useCurrentRoute();

	const isMarketPlace = currentRouteName === 'admin-marketplace';

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
		{
			(!context && isMarketPlace && <MarketplacePage />)
		|| (!context && !isMarketPlace && <AppsPage />)
		|| (context === 'details' && <AppDetailsPage id={id} marketplaceVersion={version}/>)
		|| (context === 'logs' && <AppLogsPage id={id}/>)
		|| (context === 'install' && <AppInstallPage />)
		}
	</AppProvider>;
}

export default AppsRoute;
