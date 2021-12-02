import React, { useEffect, FC } from 'react';

import { SideNav } from '../../../app/ui-utils/client';

const AdministrationLayout: FC = ({ children }) => {
	useEffect(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	}, []);

	return <>{children}</>;
};

export default AdministrationLayout;
