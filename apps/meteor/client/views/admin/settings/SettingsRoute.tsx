import React from 'react';

import { useRouteParameter } from '../../../contexts/RouterContext';
import { useIsPrivilegedSettingsContext } from '../../../contexts/SettingsContext';
import EditableSettingsProvider from '../../../providers/EditableSettingsProvider';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import GroupSelector from './GroupSelector';
import SettingsPage from './SettingsPage';

export const SettingsRoute = () => {
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
