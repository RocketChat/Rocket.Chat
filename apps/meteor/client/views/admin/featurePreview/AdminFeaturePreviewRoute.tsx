import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import SettingsProvider from '../../../providers/SettingsProvider';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import EditableSettingsProvider from '../settings/EditableSettingsProvider';
import AdminFeaturePreviewPage from './AdminFeaturePreviewPage';

const AdminFeaturePreviewRoute = (): ReactElement => {
	const canViewFeaturesPreview = usePermission('manage-cloud');

	if (!canViewFeaturesPreview) {
		return <NotAuthorizedPage />;
	}

	return (
		<SettingsProvider privileged>
			<EditableSettingsProvider>
				<AdminFeaturePreviewPage />
			</EditableSettingsProvider>
		</SettingsProvider>
	);
};

export default memo(AdminFeaturePreviewRoute);
