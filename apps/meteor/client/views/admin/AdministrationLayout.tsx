import type { FC } from 'react';
import React from 'react';

import SidebarPortal from '../../sidebar/SidebarPortal';
import AdminSidebar from './sidebar/AdminSidebar';

const AdministrationLayout: FC = ({ children }) => {
	return (
		<>
			<SidebarPortal>
				<AdminSidebar />
			</SidebarPortal>
			{children}
		</>
	);
};

export default AdministrationLayout;
