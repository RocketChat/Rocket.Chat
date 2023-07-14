import React, { lazy } from 'react';

import { useAccountRouteDefinition } from '../../../../../client/hooks/router/useAccountRouteDefinition';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

const DeviceManagementAccountPage = lazy(() => import('../../account/deviceManagement/DeviceManagementAccountPage'));

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'manage-devices': {
			pathname: '/account/manage-devices';
			pattern: '/account/manage-devices';
		};
	}
}

export const useDeviceManagement = () => {
	const licensed = useHasLicenseModule('device-management') === true;

	useAccountRouteDefinition({
		enabled: licensed,
		id: 'manage-devices',
		path: '/account/manage-devices',
		sidebar: {
			id: 'Manage_Devices',
			href: '/account/manage-devices',
			icon: 'mobile',
		},
		element: <DeviceManagementAccountPage />,
	});
};
