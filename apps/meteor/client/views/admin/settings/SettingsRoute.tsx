import { useRouteParameter, useIsPrivilegedSettingsContext } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import EditableSettingsProvider from './EditableSettingsProvider';
import GroupSelector from './GroupSelector';
import SettingsPage from './SettingsPage';

export const SettingsRoute = (): ReactElement => {
	const hasPermission = useIsPrivilegedSettingsContext();
	const groupId = useRouteParameter('group');

	if (!hasPermission) {
		return <NotAuthorizedPage />;
	}

	if (!groupId) {
		return <SettingsPage />;
	}

	return (
		<EditableSettingsProvider>
			<GroupSelector groupId={groupId} />
		</EditableSettingsProvider>
	);
};

export default SettingsRoute;
