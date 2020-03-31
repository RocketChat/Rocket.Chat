import React from 'react';

import { useAtLeastOnePermission } from '../../../contexts/AuthorizationContext';
import { useSettingsSideNav } from '../../../hooks/useSettingsSideNav';
import { GroupSelector } from './GroupSelector';
import { NotAuthorizedPage } from './NotAuthorizedPage';
import { SettingsState } from './SettingsState';

export function SettingsRoute({
	group: groupId,
}) {
	useSettingsSideNav();

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
