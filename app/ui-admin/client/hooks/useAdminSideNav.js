import { useEffect } from 'react';

import { SideNav } from '../../../ui-utils/client/lib/SideNav';

export const useAdminSideNav = () => {
	useEffect(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	}, []);
};
