import React, { ReactElement } from 'react';

import BottomBar from '../../components/BottomBar';
import Page from '../../components/Page';

const StoreView = (): ReactElement => (
	<Page flexDirection='row'>
		<Page>
			<Page.Content>StoreView</Page.Content>
			<BottomBar />
		</Page>
	</Page>
);

export default StoreView;
