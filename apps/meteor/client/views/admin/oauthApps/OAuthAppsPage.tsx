import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useRouteParameter, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import EditOauthAppWithData from './EditOauthAppWithData';
import OAuthAddApp from './OAuthAddApp';
import OAuthAppsTable from './OAuthAppsTable';
import { Page, PageHeader, PageContent } from '../../../components/Page';

const OAuthAppsPage = (): ReactElement => {
	const t = useTranslation();
	const router = useRouter();

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Third_party_login')} onClickBack={context ? () => router.navigate('/admin/third-party-login') : undefined}>
					{!context && (
						<ButtonGroup>
							<Button primary onClick={() => router.navigate('/admin/third-party-login/new')}>
								{t('New_Application')}
							</Button>
						</ButtonGroup>
					)}
				</PageHeader>
				<PageContent>
					{!context && <OAuthAppsTable />}
					{id && context === 'edit' && <EditOauthAppWithData _id={id} />}
					{context === 'new' && <OAuthAddApp />}
				</PageContent>
			</Page>
		</Page>
	);
};

export default OAuthAppsPage;
