import type { FC } from 'react';
import React from 'react';

// import { SideNav } from '../../../app/ui-utils/client';
import SidenavPortal from '../../sidebar/SidenavPortal';
import AdminSidebar from './sidebar/AdminSidebar';

const AdministrationLayout: FC = ({ children }) => {
	// useEffect(() => {
	// 	SideNav.setFlex('adminFlex');
	// 	SideNav.openFlex();
	// }, []);

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
