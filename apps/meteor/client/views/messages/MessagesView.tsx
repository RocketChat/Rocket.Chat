import React, { ReactElement } from 'react';
import BottomBar from '../../components/BottomBar';
import Page from '../../components/Page';
import TopBar from '../../topbar/TopBar';

const MessagesView = (): ReactElement => (
	<Page flexDirection='row'>
		<Page>
			<TopBar />
			<Page.Content>StoreView</Page.Content>
			<BottomBar />
		</Page>
	</Page>
);

export default MessagesView;
