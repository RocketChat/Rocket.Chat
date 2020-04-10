import { useEffect } from 'react';

import { SideNav } from '../../app/ui-utils/client/lib/SideNav';

export const useSettingsSideNav = () => {
	useEffect(() => {
		SideNav.setFlex('settingsFlex');
		SideNav.openFlex();
	}, []);
};
