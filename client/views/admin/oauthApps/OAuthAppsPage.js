import { Button, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import Page from '../../../components/Page';
import { useRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRouteParameter } from '../../../hooks/useRouteParameter';
import EditOauthAppWithData from './EditOauthAppWithData';
import OAuthAddApp from './OAuthAddApp';
import OAuthAppsTable from './OAuthAppsTable';

export function OAuthAppsPage() {
	const t = useTranslation();

	const router = useRoute('admin-oauth-apps');

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('OAuth_Applications')}>
					{context && (
						<Button alignSelf='flex-end' onClick={() => router.push({})}>
							<Icon name='back' />
							{t('Back')}
						</Button>
					)}
					{!context && (
						<Button primary alignSelf='flex-end' onClick={() => router.push({ context: 'new' })}>
							<Icon name='plus' />
							{t('New_Application')}
						</Button>
					)}
				</Page.Header>
				<Page.Content>
					{!context && <OAuthAppsTable />}
					{context === 'edit' && <EditOauthAppWithData _id={id} />}
					{context === 'new' && <OAuthAddApp />}
				</Page.Content>
			</Page>
		</Page>
	);
}

export default OAuthAppsPage;
