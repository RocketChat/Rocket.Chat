import { useRouteParameter, useRoute, usePermission, useMethod, useCurrentRoute } from '@rocket.chat/ui-contexts';
import React, { useState, useEffect, FC } from 'react';

import PageSkeleton from '../../../components/PageSkeleton';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
// import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import AppDetailsPage from './AppDetailsPage';
import AppInstallPage from './AppInstallPage';
import AppsPage from './AppsPage';
import AppsProvider from './AppsProvider';

const AppsRoute: FC = () => {
	const [isLoading, setLoading] = useState(true);
	const canManageApps = usePermission('manage-apps');
	const isAppsEngineEnabled = useMethod('apps/is-enabled');
	const appsWhatIsItRoute = useRoute('admin-apps-disabled');

	const [currentRouteName] = useCurrentRoute();
	if (!currentRouteName) {
		throw new Error('No current route name');
	}
	const isAdminSection = currentRouteName.includes('admin');

	useEffect(() => {
		let mounted = true;

		const initialize = async (): Promise<void> => {
			if (!canManageApps && isAdminSection) {
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
	}, [canManageApps, isAppsEngineEnabled, appsWhatIsItRoute, isAdminSection]);

	const context = useRouteParameter('context');
	const page = useRouteParameter('page');

	const id = useRouteParameter('id');

	if (!canManageApps && isAdminSection) {
		return <NotAuthorizedPage />;
	}

	if (isLoading) {
		return <PageSkeleton />;
	}

	return (
		<AppsProvider>
			{(page === 'list' && (
				<AppsPage context={context} canManageApps={canManageApps} isAdminSection={isAdminSection} currentRouteName={currentRouteName} />
			)) ||
				(id && page === 'info' && <AppDetailsPage id={id} isAdminSection={isAdminSection} />) ||
				(context === 'install' && <AppInstallPage />)}
		</AppsProvider>
	);
};

export default AppsRoute;
