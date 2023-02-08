import { useRouteParameter, useRoute, useMethod, usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState, useEffect } from 'react';

import PageSkeleton from '../../components/PageSkeleton';
import NotAuthorizedPage from '../notAuthorized/NotAuthorizedPage';
import AppDetailsPage from './AppDetailsPage';
import AppInstallPage from './AppInstallPage';
import AppsPage from './AppsPage/AppsPage';
import AppsProvider from './AppsProvider';

const AppsRoute = (): ReactElement => {
	const [isLoading, setLoading] = useState(true);
	const isAppsEngineEnabled = useMethod('apps/is-enabled');
	const appsWhatIsItRoute = useRoute('marketplace-disabled');
	const marketplaceRoute = useRoute('marketplace');

	const context = useRouteParameter('context') || 'explore';
	const id = useRouteParameter('id');
	const page = useRouteParameter('page');

	const isMarketplace = context === 'explore';
	const isAdminUser = usePermission('manage-apps');

	if (!page) marketplaceRoute.push({ context, page: 'list' });

	useEffect(() => {
		let mounted = true;

		const initialize = async (): Promise<void> => {
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
	}, [isAppsEngineEnabled, appsWhatIsItRoute, marketplaceRoute, context]);

	if ((context === 'requested' || page === 'install') && !isAdminUser) return <NotAuthorizedPage />;

	if (isLoading) {
		return <PageSkeleton />;
	}

	return (
		<AppsProvider>
			{(page === 'list' && <AppsPage isMarketplace={isMarketplace} />) ||
				(id && page === 'info' && <AppDetailsPage id={id} />) ||
				(page === 'install' && <AppInstallPage />)}
		</AppsProvider>
	);
};

export default AppsRoute;
