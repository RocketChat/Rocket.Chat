import React from 'react';

import { useAtLeastOnePermission } from '../../../contexts/AuthorizationContext';
import { GroupSelector } from './GroupSelector';
import { NotAuthorizedPage } from './NotAuthorizedPage';
import { SettingsState } from './SettingsState';

export function SettingsRoute({ groupId }) {
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

export default SettingsRoute;
