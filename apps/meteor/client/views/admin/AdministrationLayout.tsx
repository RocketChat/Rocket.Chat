import type { FC } from 'react';
import React from 'react';

import SidebarPortal from '../../sidebarv1/SidebarPortal';
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
