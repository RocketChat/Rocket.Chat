import { useRouteParameter, useIsPrivilegedSettingsContext, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import EditableSettingsProvider from './EditableSettingsProvider';
import SettingsGroupSelector from './SettingsGroupSelector';
import SettingsPage from './SettingsPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

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
			<SettingsGroupSelector groupId={groupId} onClickBack={() => router.navigate('/admin/settings')} />
		</EditableSettingsProvider>
	);
};

export default SettingsRoute;
