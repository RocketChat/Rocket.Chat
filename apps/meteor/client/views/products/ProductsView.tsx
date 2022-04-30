import React, { ReactElement } from 'react';

import BottomBar from '../../components/BottomBar';
import Page from '../../components/Page';
import TopBar from '../../topbar/TopBar';

const ProductsView = (): ReactElement => (
	<Page flexDirection='row'>
		<Page>
			<TopBar />
			<Page.Content>ProductsView</Page.Content>
			<BottomBar />
		</Page>
	</Page>
);

export default ProductsView;
