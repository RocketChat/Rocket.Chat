import React, { useState, useEffect } from 'react';
import { Box } from '@rocket.chat/fuselage';

import { Apps } from '../../../app/apps/client/orchestrator';
import { usePermission } from '../../contexts/AuthorizationContext';
import { useTranslation } from '../../contexts/TranslationContext';
import NotAuthorizedPage from '../NotAuthorizedPage';
import MarketplacePage from './MarketplacePage';

export default function AppsRoute() {
	const t = useTranslation();

	const canViewAppsAndMarketplace = usePermission('manage-apps');
	const [isEnabled, setEnabled] = useState(false);

	useEffect(() => {
		(async () => setEnabled(await Apps.isEnabled()))();
	}, []);

	if (!canViewAppsAndMarketplace) {
		return <NotAuthorizedPage />;
	}

	if (!isEnabled) {
		return <Box>{t('Apps_disabled')}</Box>;
	}

	return <MarketplacePage />;
}
