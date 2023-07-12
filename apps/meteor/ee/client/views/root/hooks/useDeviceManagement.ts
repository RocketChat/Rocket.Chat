import { lazy, useEffect } from 'react';

import { registerAccountRoute, registerAccountSidebarItem, unregisterSidebarItem } from '../../../../../client/views/account';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'manage-devices': {
			pathname: '/account/manage-devices';
			pattern: '/account/manage-devices';
		};
	}
}

export const useDeviceManagement = () => {
	const enabled = useHasLicenseModule('device-management');

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const [, unregisterAccountRoute] = registerAccountRoute('/manage-devices', {
			name: 'manage-devices',
			component: lazy(() => import('../../account/deviceManagement/DeviceManagementAccountPage')),
		});

		registerAccountSidebarItem({
			href: '/account/manage-devices',
			i18nLabel: 'Manage_Devices',
			icon: 'mobile',
		});

		return () => {
			unregisterAccountRoute();
			unregisterSidebarItem('Manage_Devices');
		};
	}, [enabled]);
};
