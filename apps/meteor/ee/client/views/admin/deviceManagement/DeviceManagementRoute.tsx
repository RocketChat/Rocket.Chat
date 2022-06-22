import { usePermission } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import NotAuthorizedPage from '../../../../../client/views/notAuthorized/NotAuthorizedPage';
import DeviceManagementPage from './DeviceManagementPage';

const DeviceManagement = (): ReactElement => {
	const canViewDeviceManagement = usePermission('view-device-management');

	if (!canViewDeviceManagement) {
		return <NotAuthorizedPage />;
	}

	return <DeviceManagementPage />;
};

export default DeviceManagement;
