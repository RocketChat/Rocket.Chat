import { useRoutePath, useCurrentRoute, useTranslation, useLayout } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { memo } from 'react';

import PlanTag from '../../../components/PlanTag';
import Sidebar from '../../../components/Sidebar';
import SettingsProvider from '../../../providers/SettingsProvider';
import AdminSidebarPages from './AdminSidebarPages';

const AdminSidebar: FC = () => {
	const t = useTranslation();

	const { sidebar } = useLayout();

	const currentRoute = useCurrentRoute();
	const [currentRouteName, currentRouteParams, currentQueryStringParams] = currentRoute;
	const currentPath = useRoutePath(currentRouteName || '', currentRouteParams, currentQueryStringParams);

	// TODO: uplift this provider
	return (
		<SettingsProvider privileged>
			<Sidebar>
				<Sidebar.Header
					onClose={sidebar.close}
					title={
						<>
							{t('Administration')} <PlanTag />
						</>
					}
				/>
				<Sidebar.Content>
					<AdminSidebarPages currentPath={currentPath || ''} />
				</Sidebar.Content>
			</Sidebar>
		</SettingsProvider>
	);
};

export default memo(AdminSidebar);
