import { useSetting } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import Page from '../../components/Page/Page';
import CustomHomePage from './CustomHomePage';
import HomePageHeader from './HomePageHeader';

const HomePage = (): ReactElement => {
	const custom = useSetting('Layout_Custom_Body');

	if (custom) {
		return <CustomHomePage />;
	}

	return (
		<Page data-qa='page-home'>
			<HomePageHeader />
		</Page>
	);
};

export default HomePage;
