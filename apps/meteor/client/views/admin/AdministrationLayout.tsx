import type { FC } from 'react';
import React from 'react';

import SidenavPortal from '../../sidebar/SidenavPortal';
import AdminSidebar from './sidebar/AdminSidebar';

const AdministrationLayout: FC = ({ children }) => {
	return (
		<>
			<SidenavPortal>
				<AdminSidebar />
			</SidenavPortal>
			{children}
		</>
	);
};

export default AdministrationLayout;
