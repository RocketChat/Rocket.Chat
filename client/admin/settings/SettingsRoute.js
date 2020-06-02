import React from 'react';

import { useAtLeastOnePermission } from '../../contexts/AuthorizationContext';
import { useRouteParameter } from '../../contexts/RouterContext';
import { GroupSelector } from './GroupSelector';
import NotAuthorizedPage from '../NotAuthorizedPage';
import { SettingsState } from './SettingsState';

export function SettingsRoute() {
	const hasPermission = useAtLeastOnePermission([
		'view-privileged-setting',
		'edit-privileged-setting',
		'manage-selected-settings',
	]);

	const groupId = useRouteParameter('group');

	if (!hasPermission) {
		return <NotAuthorizedPage />;
	}

	return <SettingsState>
		<GroupSelector groupId={groupId} />
	</SettingsState>;
}

export default SettingsRoute;
