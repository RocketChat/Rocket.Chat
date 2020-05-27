import React, { useState, useEffect, useCallback } from 'react';

import { useRouteParameter } from '../../contexts/RouterContext';
import { useMethod } from '../../contexts/ServerContext';
import { usePermission } from '../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../NotAuthorizedPage';
import AppDetailsPage from './AppDetailsPage';
import MarketplacePage from './MarketplacePage';
import AppLogsPage from './AppLogsPage';
import AppsWhatIsIt from './AppsWhatIsIt';

export default function AppsRoute() {
	const canViewAppsAndMarketplace = usePermission('manage-apps');
	const [isEnabled, setEnabled] = useState(false);

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const version = useRouteParameter('version');
	const checkIsEnabled = useMethod('apps/is-enabled');

	const updateEnabled = useCallback(async () => setEnabled(await checkIsEnabled()), []);

	useEffect(() => {
		updateEnabled();
	}, []);

	if (!canViewAppsAndMarketplace) {
		return <NotAuthorizedPage />;
	}

	if (!isEnabled) {
		return <AppsWhatIsIt updateEnabled={updateEnabled}/>;
	}

	return <>
		{!context && <MarketplacePage />}
		{context === 'details' && <AppDetailsPage id={id} marketplaceVersion={version}/>}
		{context === 'logs' && <AppLogsPage id={id}/>}
	</>;
}
