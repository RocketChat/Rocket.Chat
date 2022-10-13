import { useRouteParameter, useRoute, usePermission, useMethod } from '@rocket.chat/ui-contexts';
import React, { useState, useEffect, FC } from 'react';

import PageSkeleton from '../../../components/PageSkeleton';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import AppDetailsPage from './AppDetailsPage';
import AppInstallPage from './AppInstallPage';
import AppsPage from './AppsPage';
import AppsProvider from './AppsProvider';

const AppsRoute: FC = () => {
	const [isLoading, setLoading] = useState(true);
	const canManageApps = usePermission('manage-apps');
	const isAppsEngineEnabled = useMethod('apps/is-enabled');
	const appsWhatIsItRoute = useRoute('admin-apps-disabled');
	const marketplaceRoute = useRoute('admin-marketplace');

	useEffect(() => {
		let mounted = true;

		const initialize = async (): Promise<void> => {
			if (!canManageApps) {
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

		return (): void => {
			mounted = false;
		};
	}, [canManageApps, isAppsEngineEnabled, appsWhatIsItRoute, marketplaceRoute]);

	const context = useRouteParameter('context');

	const isMarketplace = !context;

	const id = useRouteParameter('id');
	const page = useRouteParameter('page');

	if (!canManageApps) {
		return <NotAuthorizedPage />;
	}

	if (isLoading) {
		return <PageSkeleton />;
	}

	return (
		<AppsProvider>
			{(page === 'list' && <AppsPage isMarketplace={isMarketplace} />) ||
				(id && page === 'info' && <AppDetailsPage id={id} />) ||
				(context === 'install' && <AppInstallPage />)}
		</AppsProvider>
	);
};

export default AppsRoute;
