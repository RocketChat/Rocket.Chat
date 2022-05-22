import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import Page from '../../../components/Page';
import { useEndpointData } from '../../../hooks/useEndpointData';
import AccountTokensTable from './AccountTokensTable';
import AddToken from './AddToken';

const AccountTokensPage = () => {
	const t = useTranslation();
	const { value: data, reload } = useEndpointData('users.getPersonalAccessTokens');

	return (
		<Page>
			<Page.Header title={t('Personal_Access_Tokens')} />
			<Page.Content>
				<AddToken onDidAddToken={reload} />
				<AccountTokensTable data={data} reload={reload} />
			</Page.Content>
		</Page>
	);
};

export default AccountTokensPage;
