import { usePermission } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import NotAuthorizedPage from '../../../../../client/views/notAuthorized/NotAuthorizedPage';
import DeviceManagementAccountPage from './DeviceManagementAccountPage';

const DeviceManagementAccountRoute = (): ReactElement => {
	const canViewDeviceManagement = usePermission('view-device-management');

	if (!canViewDeviceManagement) {
		return <NotAuthorizedPage />;
	}

	return <DeviceManagementAccountPage />;
};

export default DeviceManagementAccountRoute;
