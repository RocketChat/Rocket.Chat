import type { ReactNode } from 'react';
import React from 'react';

import SidebarPortal from '../../sidebar/SidebarPortal';
import AdminSidebar from './sidebar/AdminSidebar';

type AdministrationLayoutProps = {
	children?: ReactNode;
};

const AdministrationLayout = ({ children }: AdministrationLayoutProps) => {
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
