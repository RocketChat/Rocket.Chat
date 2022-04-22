import { Button, Icon } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import Page from '../../../components/Page';
import { useRouteParameter, useRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import EditOauthAppWithData from './EditOauthAppWithData';
import OAuthAddApp from './OAuthAddApp';
import OAuthAppsTable from './OAuthAppsTable';

const OAuthAppsPage = (): ReactElement => {
	const t = useTranslation();

	const router = useRoute('admin-oauth-apps');

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('OAuth_Applications')}>
					{context && (
						<Button alignSelf='flex-end' onClick={(): void => router.push({})}>
							<Icon name='back' />
							{t('Back')}
						</Button>
					)}
					{!context && (
						<Button primary alignSelf='flex-end' onClick={(): void => router.push({ context: 'new' })}>
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
};

export default OAuthAppsPage;
