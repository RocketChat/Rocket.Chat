import React, { useState, useEffect } from 'react';
import { Box } from '@rocket.chat/fuselage';

import { Apps } from '../../../app/apps/client/orchestrator';
import { useRouteParameter } from '../../contexts/RouterContext';
import { usePermission } from '../../contexts/AuthorizationContext';
import { useTranslation } from '../../contexts/TranslationContext';
import NotAuthorizedPage from '../NotAuthorizedPage';
import AppDetailsPage from './AppDetailsPage';
import MarketplacePage from './MarketplacePage';

export default function AppsRoute() {
	const t = useTranslation();

	const canViewAppsAndMarketplace = usePermission('manage-apps');
	const [isEnabled, setEnabled] = useState(false);

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const version = useRouteParameter('version');

	useEffect(() => {
		(async () => setEnabled(await Apps.isEnabled()))();
	}, []);

	if (!canViewAppsAndMarketplace) {
		return <NotAuthorizedPage />;
	}

	if (!isEnabled) {
		return <Box>{t('Apps_disabled')}</Box>;
	}

	return <>
		{!context && <MarketplacePage />}
		{context === 'details' && <AppDetailsPage id={id} marketplaceVersion={version}/>}
	</>;
}
