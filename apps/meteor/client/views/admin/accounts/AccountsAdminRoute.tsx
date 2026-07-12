import { usePermission } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import AccountsAdminPage from './AccountsAdminPage';
import SettingsProvider from '../../../providers/SettingsProvider';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const AccountsAdminRoute = () => {
	const canViewSettings = usePermission('view-privileged-setting');

	if (!canViewSettings) {
		return <NotAuthorizedPage />;
	}

	return (
		<SettingsProvider>
			<AccountsAdminPage />
		</SettingsProvider>
	);
};

export default memo(AccountsAdminRoute);
