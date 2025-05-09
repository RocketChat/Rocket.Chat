import { useTranslation, useLayout, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import AdminSidebarPages from './AdminSidebarPages';
import PlanTag from '../../../components/PlanTag';
import Sidebar from '../../../components/Sidebar';
import SettingsProvider from '../../../providers/SettingsProvider';

const AdminSidebar = () => {
	const t = useTranslation();

	const { sidebar } = useLayout();

	const currentPath = useCurrentRoutePath();

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
