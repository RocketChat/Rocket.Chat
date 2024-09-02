import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import AdminFeaturePreviewPage from './AdminFeaturePreviewPage';

const AdminFeaturePreviewRoute = (): ReactElement => {
	const canViewSubscription = usePermission('manage-cloud');

	if (!canViewSubscription) {
		return <NotAuthorizedPage />;
	}

	return <AdminFeaturePreviewPage />;
};

export default memo(AdminFeaturePreviewRoute);
