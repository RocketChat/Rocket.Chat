import React from 'react';

import { useRouteParameter } from '../../contexts/RouterContext';
import { useAdminSideNav } from '../../hooks/useAdminSideNav';
import InformationRoute from './info/InformationRoute';
import SettingsRoute from './settings/SettingsRoute';

function Router() {
	useAdminSideNav();

	const groupId = useRouteParameter('group');

	if (groupId === 'info') {
		return <InformationRoute />;
	}

	return <SettingsRoute groupId={groupId} />;
}

export default Router;
