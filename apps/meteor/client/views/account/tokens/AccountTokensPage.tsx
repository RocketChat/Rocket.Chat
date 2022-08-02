import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import Page from '../../../components/Page';
import AccountTokensTable from './AccountTokensTable';

const AccountTokensPage = (): ReactElement => {
	const t = useTranslation();

	return (
		<Page>
			<Page.Header title={t('Personal_Access_Tokens')} />
			<Page.Content>
				<AccountTokensTable />
			</Page.Content>
		</Page>
	);
};

export default AccountTokensPage;
