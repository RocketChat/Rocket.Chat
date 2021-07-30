import React, { useCallback, useMemo, useEffect, memo } from 'react';

import { menu, SideNav, Layout } from '../../../../app/ui-utils/client';
import PlanTag from '../../../components/PlanTag';
import Sidebar from '../../../components/Sidebar';
import { useAtLeastOnePermission } from '../../../contexts/AuthorizationContext';
import { useRoutePath, useCurrentRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import SettingsProvider from '../../../providers/SettingsProvider';
import AdminSidebarPages from './AdminSidebarPages';
import AdminSidebarSettings from './AdminSidebarSettings';

function AdminSidebar() {
	const t = useTranslation();

	const canViewSettings = useAtLeastOnePermission(
		useMemo(
			() => ['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings'],
			[],
		),
	);

	const closeAdminFlex = useCallback(() => {
		if (Layout.isEmbedded()) {
			menu.close();
			return;
		}

		SideNav.closeFlex();
	}, []);

	const currentRoute = useCurrentRoute();
	const currentPath = useRoutePath(...currentRoute);
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
					<AdminSidebarPages currentPath={currentPath} />
					{canViewSettings && <AdminSidebarSettings currentPath={currentPath} />}
				</Sidebar.Content>
			</Sidebar>
		</SettingsProvider>
	);
}

export default memo(AdminSidebar);
