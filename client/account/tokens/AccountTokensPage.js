import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import Page from '../../components/basic/Page';
import AccountTokensTable from './AccountTokensTable';
import AddToken from './AddToken';

const AccountTokensPage = () => {
	const t = useTranslation();
	const { data, reload } = useEndpointDataExperimental('users.getPersonalAccessTokens');

	return <Page>
		<Page.Header title={t('Personal_Access_Tokens')}/>
		<Page.Content>
			<AddToken onDidAddToken={reload}/>
			<AccountTokensTable data={data} reload={reload} />
		</Page.Content>
	</Page>;
};

export default AccountTokensPage;
