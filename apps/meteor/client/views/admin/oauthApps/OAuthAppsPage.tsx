import { Button } from '@rocket.chat/fuselage';
import { useRouteParameter, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import Page from '../../../components/Page';
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
				<Page.Header title={t('Third_party_login')}>
					{context && (
						<Button icon='back' alignSelf='flex-end' onClick={(): void => router.push({})}>
							{t('Back')}
						</Button>
					)}
					{!context && (
						<Button primary alignSelf='flex-end' onClick={(): void => router.push({ context: 'new' })}>
							{t('New_Application')}
						</Button>
					)}
				</Page.Header>
				<Page.Content>
					{!context && <OAuthAppsTable />}
					{id && context === 'edit' && <EditOauthAppWithData _id={id} />}
					{context === 'new' && <OAuthAddApp />}
				</Page.Content>
			</Page>
		</Page>
	);
};

export default OAuthAppsPage;
