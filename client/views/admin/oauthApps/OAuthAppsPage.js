import React from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';

import Page from '../../../components/Page';
// import VerticalBar from '../../components/VerticalBar';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRouteParameter, useRoute } from '../../../contexts/RouterContext';
import OAuthAppsTable from './OAuthAppsTable';
import OAuthEditAppWithData from './OAuthEditApp';
import OAuthAddApp from './OAuthAddApp';

export function OAuthAppsPage() {
	const t = useTranslation();

	const router = useRoute('admin-oauth-apps');

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={t('OAuth_Applications')}>
				{context && <Button alignSelf='flex-end' onClick={() => router.push({})}>
					<Icon name='back'/>{t('Back')}
				</Button>}
				{!context && <Button primary alignSelf='flex-end' onClick={() => router.push({ context: 'new' })}>
					<Icon name='plus'/>{t('New_Application')}
				</Button>}
			</Page.Header>
			<Page.Content>
				{!context && <OAuthAppsTable />}
				{context === 'edit' && <OAuthEditAppWithData _id={id}/>}
				{context === 'new' && <OAuthAddApp />}
			</Page.Content>
		</Page>
	</Page>;
}

export default OAuthAppsPage;
