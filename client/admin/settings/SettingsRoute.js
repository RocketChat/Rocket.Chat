import React from 'react';

import { useIsPrivilegedSettingsContextAuthorized } from '../../contexts/PrivilegedSettingsContext';
import { useRouteParameter } from '../../contexts/RouterContext';
import { GroupSelector } from './GroupSelector';
import NotAuthorizedPage from '../NotAuthorizedPage';

export function SettingsRoute() {
	const hasPermission = useIsPrivilegedSettingsContextAuthorized();

	const groupId = useRouteParameter('group');

	if (!hasPermission) {
		return <NotAuthorizedPage />;
	}

	return <GroupSelector groupId={groupId} />;
}

export default SettingsRoute;
