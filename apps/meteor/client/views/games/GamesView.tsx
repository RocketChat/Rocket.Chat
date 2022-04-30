import React, { ReactElement } from 'react';

import Page from '../../components/Page';
import BottomBar from '../../components/BottomBar';
import TopBar from '../../topbar/TopBar';

const GamesView = (): ReactElement => (
	<Page flexDirection='row'>
		<Page>
			<TopBar />

			<Page.Content>GamesView</Page.Content>
			<BottomBar />
		</Page>
	</Page>
);

export default GamesView;
