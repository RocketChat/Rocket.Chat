import React from 'react';

import { useAtLeastOnePermission } from '../../../hooks/usePermissions';
import { useAdminSideNav } from '../hooks';
import { GroupSelector } from './GroupSelector';
import { NotAuthorizedPage } from './NotAuthorizedPage';
import { SettingsState } from './SettingsState';

export function SettingsRoute({
	group: groupId,
}) {
	useAdminSideNav();

	const hasPermission = useAtLeastOnePermission([
		'view-privileged-setting',
		'edit-privileged-setting',
		'manage-selected-settings',
	]);

	if (!hasPermission) {
		return <NotAuthorizedPage />;
	}

	return <SettingsState groupId={groupId}>
		<GroupSelector />
	</SettingsState>;
}
