import React from 'react';

import { useRouteParameter } from '../../contexts/RouterContext';
import { useIsPrivilegedSettingsContext } from '../../contexts/SettingsContext';
import NotAuthorizedPage from '../NotAuthorizedPage';
import PrivilegedSettingsProvider from '../PrivilegedSettingsProvider';
import { GroupSelector } from './GroupSelector';

export function SettingsRoute() {
	const hasPermission = useIsPrivilegedSettingsContext();

	const groupId = useRouteParameter('group');

	if (!hasPermission) {
		return <NotAuthorizedPage />;
	}

	return <PrivilegedSettingsProvider>
		<GroupSelector groupId={groupId} />
	</PrivilegedSettingsProvider>;
}

export default SettingsRoute;
