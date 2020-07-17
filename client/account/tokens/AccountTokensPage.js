import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import { usePermission } from '../../contexts/AuthorizationContext';
import Page from '../../components/basic/Page';
import AccountTokensTable from './AccountTokensTable';
import AddToken from './AddToken';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';

const AccountTokensPage = () => {
	const t = useTranslation();

	const canCreateTokens = usePermission('create-personal-access-tokens');

	const { data, reload } = useEndpointDataExperimental('users.getPersonalAccessTokens');

	if (!canCreateTokens) {
		return <NotAuthorizedPage />;
	}

	return <Page>
		<Page.Header title={t('Personal_Access_Tokens')}/>
		<Page.Content>
			<AddToken onDidAddToken={reload}/>
			<AccountTokensTable data={data} reload={reload} />
		</Page.Content>
	</Page>;
};

export default AccountTokensPage;
