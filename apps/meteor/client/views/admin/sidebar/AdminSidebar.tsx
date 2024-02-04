import { useTranslation, useLayout, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { memo } from 'react';

import PlanTag from '../../../components/PlanTag';
import Sidebar from '../../../components/Sidebar';
import SettingsProvider from '../../../providers/SettingsProvider';
import AdminSidebarPages from './AdminSidebarPages';

const AdminSidebar: FC = () => {
	const t = useTranslation();

	const { sidebar, isMobile } = useLayout();

	const currentPath = useCurrentRoutePath();

	// TODO: uplift this provider
	return (
		<SettingsProvider privileged>
			<Sidebar>
				<Sidebar.Header
					onClose=
					{isMobile ? sidebar.toggle : sidebar.close}
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
