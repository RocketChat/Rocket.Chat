import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import CustomHomePage from './CustomHomePage';
import DefaultHomePage from './DefaultHomePage';

const HomePage = (): ReactElement => {
	const customOnly = useSetting('Layout_Custom_Body_Only');

	if (customOnly) {
		return <CustomHomePage />;
	}

	return <DefaultHomePage />;
};

export default HomePage;
