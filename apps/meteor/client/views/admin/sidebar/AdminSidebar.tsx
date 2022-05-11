import { useRoutePath, useCurrentRoute, useAtLeastOnePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useMemo, useEffect, memo, FC } from 'react';

import { menu, SideNav } from '../../../../app/ui-utils/client';
import PlanTag from '../../../components/PlanTag';
import Sidebar from '../../../components/Sidebar';
import { isLayoutEmbedded } from '../../../lib/utils/isLayoutEmbedded';
import SettingsProvider from '../../../providers/SettingsProvider';
import AdminSidebarPages from './AdminSidebarPages';
import AdminSidebarSettings from './AdminSidebarSettings';

const AdminSidebar: FC = () => {
	const t = useTranslation();

	const canViewSettings = useAtLeastOnePermission(
		useMemo(() => ['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings'], []),
	);

	const closeAdminFlex = useCallback(() => {
		if (isLayoutEmbedded()) {
			menu.close();
			return;
		}

		SideNav.closeFlex();
	}, []);

	const currentRoute = useCurrentRoute();
	const [currentRouteName, currentRouteParams, currentQueryStringParams] = currentRoute;
	const currentPath = useRoutePath(currentRouteName || '', currentRouteParams, currentQueryStringParams);
	const [, , , currentRouteGroupName] = currentRoute;

	useEffect(() => {
		if (currentRouteGroupName !== 'admin') {
			SideNav.toggleFlex(-1);
		}
	}, [currentRouteGroupName]);

	// TODO: uplift this provider
	return (
		<SettingsProvider privileged>
			<Sidebar>
				<Sidebar.Header
					onClose={closeAdminFlex}
					title={
						<>
							{t('Administration')} <PlanTag />
						</>
					}
				/>
				<Sidebar.Content>
					<AdminSidebarPages currentPath={currentPath || ''} />
					{canViewSettings && <AdminSidebarSettings currentPath={currentPath || ''} />}
				</Sidebar.Content>
			</Sidebar>
		</SettingsProvider>
	);
};

export default memo(AdminSidebar);
