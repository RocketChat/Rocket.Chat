import { usePermission } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

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
