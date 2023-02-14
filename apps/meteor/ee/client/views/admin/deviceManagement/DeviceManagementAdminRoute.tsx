import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import NotAuthorizedPage from '../../../../../client/views/notAuthorized/NotAuthorizedPage';
import DeviceManagementAdminPage from './DeviceManagementAdminPage';

const DeviceManagementAdminRoute = (): ReactElement => {
	const canViewDeviceManagement = usePermission('view-device-management');

	if (!canViewDeviceManagement) {
		return <NotAuthorizedPage />;
	}

	return <DeviceManagementAdminPage />;
};

export default DeviceManagementAdminRoute;
