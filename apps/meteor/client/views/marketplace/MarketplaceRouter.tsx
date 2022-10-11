import { useCurrentRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import Sidebar from '../../components/Sidebar';

const MarketplaceRouter = () => {
	const [route] = useCurrentRoute();
	const t = useTranslation();
	return (
		<>
			<Sidebar>
				<Sidebar.Header
					onClose={closeAdminFlex}
					title={
						<>
							{t('Marketplace')} <PlanTag />
						</>
					}
				/>
				<Sidebar.Content>
					<Sidebar.Item selected={route === 'dasdasd'}>dasdasd</Sidebar.Item>
					{/* <AdminSidebarPages currentPath={currentPath || ''} /> */}
				</Sidebar.Content>
			</Sidebar>
			{/* {route === 'requests' ...} */}
			{/* {route === 'installed' ...} */}
		</>
	);
};

export default MarketplaceRouter;
