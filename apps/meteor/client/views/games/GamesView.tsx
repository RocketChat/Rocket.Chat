import React, { ReactElement } from 'react';

import Page from '../../components/Page';
import BottomBar from '../../components/BottomBar';

const GamesView = (): ReactElement => (
	<Page flexDirection='row'>
		<Page>
			<Page.Content>GamesView</Page.Content>
			<BottomBar />
		</Page>
	</Page>
);

export default GamesView;
