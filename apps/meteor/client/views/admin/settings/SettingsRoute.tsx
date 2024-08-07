import { useRouteParameter, useIsPrivilegedSettingsContext, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import EditableSettingsProvider from './EditableSettingsProvider';
import GroupSelector from './GroupSelector';
import SettingsPage from './SettingsPage';

export const SettingsRoute = (): ReactElement => {
	const hasPermission = useIsPrivilegedSettingsContext();
	const groupId = useRouteParameter('group');
	const router = useRouter();

	if (!hasPermission) {
		return <NotAuthorizedPage />;
	}

	if (!groupId) {
		return <SettingsPage />;
	}

	return (
		<EditableSettingsProvider>
			<GroupSelector groupId={groupId} onClickBack={() => router.navigate('/admin/settings')} />
		</EditableSettingsProvider>
	);
};

export default SettingsRoute;
