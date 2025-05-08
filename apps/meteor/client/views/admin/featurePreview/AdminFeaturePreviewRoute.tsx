import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo } from 'react';

import AdminFeaturePreviewPage from './AdminFeaturePreviewPage';
import SettingsProvider from '../../../providers/SettingsProvider';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import EditableSettingsProvider from '../settings/EditableSettingsProvider';

const AdminFeaturePreviewRoute = (): ReactElement => {
	const canViewFeaturesPreview = usePermission('manage-cloud');

	if (!canViewFeaturesPreview) {
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
