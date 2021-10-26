import React, { useState, useEffect } from 'react';

import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import PageSkeleton from '../../../components/PageSkeleton';
import { usePermission } from '../../../contexts/AuthorizationContext';
import { useRouteParameter, useRoute } from '../../../contexts/RouterContext';
import { useMethod } from '../../../contexts/ServerContext';
import AppDetailsPage from './AppDetailsPage';
import AppInstallPage from './AppInstallPage';
import AppLogsPage from './AppLogsPage';
import AppsPage from './AppsPage';
import AppsProvider from './AppsProvider';

const AppsRoute = () => {
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

			if (!(await isAppsEngineEnabled())) {
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

	const isMarketPlace = !context;

	const id = useRouteParameter('id');
	const version = useRouteParameter('version');

	if (!canViewAppsAndMarketplace) {
		return <NotAuthorizedPage />;
	}

	if (isLoading) {
		return <PageSkeleton />;
	}

	return (
		<AppsProvider>
			{((!context || context === 'installed') && (
				<AppsPage isMarketPlace={isMarketPlace} context={context} />
			)) ||
				(context === 'details' && <AppDetailsPage id={id} marketplaceVersion={version} />) ||
				(context === 'logs' && <AppLogsPage id={id} />) ||
				(context === 'install' && <AppInstallPage />)}
		</AppsProvider>
	);
};

export default AppsRoute;
