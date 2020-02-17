import React from 'react';

import { useAtLeastOnePermission } from '../../../contexts/AuthorizationContext';
import { useAdminSideNav } from '../../../hooks/useAdminSideNav';
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

	return <SettingsState>
		<GroupSelector groupId={groupId} />
	</SettingsState>;
}
