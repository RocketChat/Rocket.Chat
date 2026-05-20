import { useIsPrivilegedSettingsContext, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import EditableSettingsProvider from '../settings/EditableSettingsProvider';
import SettingsGroupSelector from '../settings/SettingsGroupSelector';

const AICenterRoute = (): ReactElement => {
	const hasPermission = useIsPrivilegedSettingsContext();
	const router = useRouter();

	if (!hasPermission) {
		return <NotAuthorizedPage />;
	}

	return (
		<EditableSettingsProvider>
			<SettingsGroupSelector groupId='AI_Center' onClickBack={() => router.navigate('/admin')} />
		</EditableSettingsProvider>
	);
};

export default AICenterRoute;
