import React from 'react';

import { useAtLeastOnePermission } from '../../../contexts/AuthorizationContext';
import { useAdminSideNav } from '../../../hooks/useAdminSideNav';
import { GroupSelector } from './GroupSelector';
import { NotAuthorizedPage } from './NotAuthorizedPage';
import { SettingsState } from './SettingsState';
import { useRouteParameter } from '../../../contexts/RouterContext';

export function SettingsRoute() {
	useAdminSideNav();

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
