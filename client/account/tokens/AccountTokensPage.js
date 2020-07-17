import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import { usePermission } from '../../contexts/AuthorizationContext';
import { useUserId } from '../../contexts/UserContext';
import Page from '../../components/basic/Page';
import AccountTokensTable from './AccountTokensTable';
import AddToken from './AddToken';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';

const emptyObj = {};

const AccountTokensPage = () => {
	const t = useTranslation();
	const userId = useUserId();

	const canCreateTokens = usePermission('create-personal-access-tokens');

	const { data, reload } = useEndpointDataExperimental('users.getPersonalAccessTokens', emptyObj, []);

	if (!canCreateTokens) {
		return <NotAuthorizedPage />;
	}

	return <Page>
		<Page.Header title={t('Personal_Access_Tokens')}/>
		<Page.Content>
			<AddToken userId={userId} reload={reload}/>
			<AccountTokensTable userId={userId} data={data} reload={reload} />
		</Page.Content>
	</Page>;
};

export default AccountTokensPage;
