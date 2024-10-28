import { useRouteParameter, usePermission, useRouter } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';

import AppDetailsPage from './AppDetailsPage';
import AppInstallPage from './AppInstallPage';
import AppsOrchestratorProvider from './AppsOrchestratorProvider';
import AppsPage from './AppsPage';
import BannerEnterpriseTrialEnded from './components/BannerEnterpriseTrialEnded';
import { useMarketplaceContext } from './hooks/useMarketplaceContext';
import NotAuthorizedPage from '../notAuthorized/NotAuthorizedPage';

const AppsRoute = () => {
	const router = useRouter();
	const context = useMarketplaceContext();
	const id = useRouteParameter('id');
	const page = useRouteParameter('page');

	const canManageApps = usePermission('manage-apps');
	const canAccessMarketplace = usePermission('access-marketplace');

	useEffect(() => {
		if (page) return;

		router.navigate({ name: 'marketplace', params: { ...router.getRouteParameters(), page: 'list' } }, { replace: true });
	}, [page, router]);

	if (
		(context === 'explore' || context === 'installed' || context === 'private' || context === 'premium') &&
		!canAccessMarketplace &&
		!canManageApps
	) {
		return <NotAuthorizedPage />;
	}

	if ((context === 'requested' || page === 'install') && !canManageApps) return <NotAuthorizedPage />;

	return (
		<AppsOrchestratorProvider>
			<BannerEnterpriseTrialEnded />
			{(page === 'list' && <AppsPage />) ||
				(id && page === 'info' && <AppDetailsPage id={id} />) ||
				(page === 'install' && <AppInstallPage />)}
		</AppsOrchestratorProvider>
	);
};

export default AppsRoute;
