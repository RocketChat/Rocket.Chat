import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

import { KonchatNotification } from '../../../app/ui/client/lib/KonchatNotification';
import CustomHomePage from './CustomHomePage';
import DefaultHomePage from './DefaultHomePage';

const HomePage = (): ReactElement => {
	useEffect(() => {
		KonchatNotification.getDesktopPermission();
	}, []);

	const customOnly = useSetting('Layout_Custom_Body_Only');

	if (customOnly) {
		return <CustomHomePage />;
	}

	return <DefaultHomePage />;
};

export default HomePage;
