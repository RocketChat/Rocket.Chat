import React from 'react';

import { useAtLeastOnePermission } from '../../../hooks/usePermissions';
import { useAdminSideNav } from '../hooks';
import { NotAuthorizedPage } from './NotAuthorizedPage';
import { EditingState } from './EditingState';
import { GroupSelector } from './GroupSelector';

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

	return <EditingState groupId={groupId}>
		<GroupSelector />
	</EditingState>;
}
