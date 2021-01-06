import React from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';

import Page from '../../../components/Page';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import EmailChannelTable from './EmailChannelTable';
import EmailChannelNew from './EmailChannelNew';


export function EmailChannelPage() {
	const t = useTranslation();

	const context = useRouteParameter('context');
	// const id = useRouteParameter('id');

	const emailChannelRoute = useRoute('admin-email-channel');

	const handleNewButtonClick = () => {
		emailChannelRoute.push({ context: 'new' });
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={t('Email_Channel')}>
				{context && <Button alignSelf='flex-end' onClick={() => emailChannelRoute.push({})}>
					<Icon name='back'/>{t('Back')}
				</Button>}
				{!context && <Button primary onClick={handleNewButtonClick}>
					<Icon name='plus'/> {t('New_Email_Channel')}
				</Button>}
			</Page.Header>
			<Page.Content>
				{!context && <EmailChannelTable />}
				{context === 'new' && <EmailChannelNew />}
				{/* <Page.ScrollableContentWithShadow>
					<Box maxWidth='x600' w='full' alignSelf='center'>
					</Box>
				</Page.ScrollableContentWithShadow> */}
			</Page.Content>
		</Page>
	</Page>;
}

export default EmailChannelPage;
