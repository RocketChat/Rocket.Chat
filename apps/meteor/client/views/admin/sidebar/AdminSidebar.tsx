import { useTranslation, useLayout, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import { memo, useEffect } from 'react';

import AdminSidebarPages from './AdminSidebarPages';
import PlanTag from '../../../components/PlanTag';
import Sidebar from '../../../components/Sidebar';
import SettingsProvider from '../../../providers/SettingsProvider';

const AdminSidebar = () => {
	const t = useTranslation();
	const { sidebar, isMobile } = useLayout();
	const currentPath = useCurrentRoutePath();

	useEffect(() => {
		if (isMobile && !sidebar.isCollapsed) sidebar.collapse();
	}, [currentPath, isMobile]);

	// TODO: uplift this provider
	return (
		<SettingsProvider>
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