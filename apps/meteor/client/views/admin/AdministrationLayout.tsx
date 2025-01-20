import type { ReactNode } from 'react';

import AdminSidebar from './sidebar/AdminSidebar';
import SidebarPortal from '../../sidebar/SidebarPortal';

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
