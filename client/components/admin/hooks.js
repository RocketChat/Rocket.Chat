import { useEffect } from 'react';

import { SideNav } from '../../../app/ui-utils/client';

export const useAdminSideNav = () => {
	useEffect(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	}, []);
};
