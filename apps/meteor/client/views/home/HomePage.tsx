import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect } from 'react';

import CustomHomePage from './CustomHomePage';
import DefaultHomePage from './DefaultHomePage';
import { KonchatNotification } from '../../../app/ui/client/lib/KonchatNotification';

const KEY = 'invite_token';

const HomePage = (): ReactElement => {
	useEffect(() => {
		sessionStorage.removeItem(KEY);
		KonchatNotification.getDesktopPermission();
	}, []);

	const customOnly = useSetting('Layout_Custom_Body_Only');

	if (customOnly) {
		return <CustomHomePage />;
	}

	return <DefaultHomePage />;
};

export default HomePage;
