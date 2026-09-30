import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { useRouteParameter, useIsPrivilegedSettingsContext, useRouter } from '@rocket.chat/ui-contexts';

import EditableSettingsProvider from './EditableSettingsProvider';
import SettingsGroupSelector from './SettingsGroupSelector';
import SettingsPage from './SettingsPage';

export const SettingsRoute = () => {
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
