import { usePermission, useIsPrivilegedSettingsContext } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import AdminFeaturePreviewPage from './AdminFeaturePreviewPage';
import SettingsProvider from '../../../providers/SettingsProvider';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import EditableSettingsProvider from '../settings/EditableSettingsProvider';

const AdminFeaturePreviewRoute = () => {
	const hasPermission = useIsPrivilegedSettingsContext();
	const canManageFeatures = usePermission('manage-feature-preview');

	if (!canManageFeatures || !hasPermission) {
		return <NotAuthorizedPage />;
	}

	return (
		<SettingsProvider>
			<EditableSettingsProvider>
				<AdminFeaturePreviewPage />
			</EditableSettingsProvider>
		</SettingsProvider>
	);
};

export default memo(AdminFeaturePreviewRoute);
