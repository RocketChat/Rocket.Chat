import React, { ReactElement } from 'react';

import BottomBar from '../../components/BottomBar';
import Page from '../../components/Page';

const ProductsView = (): ReactElement => (
	<Page flexDirection='row'>
		<Page>
			<Page.Content>ProductsView</Page.Content>
			<BottomBar />
		</Page>
	</Page>
);

export default ProductsView;
