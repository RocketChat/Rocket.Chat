import { useSetting, useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

import CustomHomePage from './CustomHomePage';
import DefaultHomePage from './DefaultHomePage';

const HomePage = (): ReactElement => {
	const conferenceRoute = useRoute('conference');
	const [, params, queryParams] = useCurrentRoute();
	const customOnly = useSetting('Layout_Custom_Body_Only');

	useEffect(() => {
		if (params?.context === 'redirectConference') {
			conferenceRoute.push(params, queryParams);
		}
	}, [conferenceRoute, params, queryParams]);

	if (customOnly) {
		return <CustomHomePage />;
	}

	return <DefaultHomePage />;
};

export default HomePage;
