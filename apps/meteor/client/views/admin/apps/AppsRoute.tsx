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
	const canViewAppsAndMarketplace = usePermission('manage-apps');
	const isAppsEngineEnabled = useMethod('apps/is-enabled');
	const appsWhatIsItRoute = useRoute('admin-apps-disabled');

	useEffect(() => {
		let mounted = true;

		const initialize = async (): Promise<void> => {
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

		return (): void => {
			mounted = false;
		};
	}, [canViewAppsAndMarketplace, isAppsEngineEnabled, appsWhatIsItRoute]);

	const context = useRouteParameter('context');

	const isMarketplace = !context;

	const id = useRouteParameter('id');

	if (!canViewAppsAndMarketplace) {
		return <NotAuthorizedPage />;
	}

	if (isLoading) {
		return <PageSkeleton />;
	}

	return (
		<AppsProvider>
			{((!context || context === 'installed') && <AppsPage isMarketplace={isMarketplace} />) ||
				(id && context === 'details' && <AppDetailsPage id={id} />) ||
				(context === 'install' && <AppInstallPage />)}
		</AppsProvider>
	);
};

export default AppsRoute;
