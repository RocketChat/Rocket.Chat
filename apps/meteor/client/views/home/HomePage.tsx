import { useSetting } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import CustomHomePage from './CustomHomePage';
import DefaultHomePage from './DefaultHomePage';

const HomePage = (): ReactElement => {
	const custom = useSetting('Layout_Custom_Body');

	if (custom) {
		return <CustomHomePage />;
	}

	return <DefaultHomePage />;
};

export default HomePage;
