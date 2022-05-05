import { useRouteParameter, useIsPrivilegedSettingsContext } from '@rocket.chat/ui-contexts';
import React from 'react';

import EditableSettingsProvider from '../../../providers/EditableSettingsProvider';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import GroupSelector from './GroupSelector';

export function SettingsRoute() {
	const hasPermission = useIsPrivilegedSettingsContext();

	const groupId = useRouteParameter('group');

	if (!hasPermission) {
		return <NotAuthorizedPage />;
	}

	return (
		<EditableSettingsProvider>
			<GroupSelector groupId={groupId} />
		</EditableSettingsProvider>
	);
}

export default SettingsRoute;
