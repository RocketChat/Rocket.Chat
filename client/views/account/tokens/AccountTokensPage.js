import React from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import Page from '../../../components/Page';
import AccountTokensTable from './AccountTokensTable';
import AddToken from './AddToken';
import { useEndpointData } from '../../../hooks/useEndpointData';

const AccountTokensPage = () => {
	const t = useTranslation();
	const { value: data, reload } = useEndpointData('users.getPersonalAccessTokens');

	return <Page>
		<Page.Header title={t('Personal_Access_Tokens')}/>
		<Page.Content>
			<AddToken onDidAddToken={reload}/>
			<AccountTokensTable data={data} reload={reload} />
		</Page.Content>
	</Page>;
};

export default AccountTokensPage;
