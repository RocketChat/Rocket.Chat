import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { Page, PageHeader, PageContent } from '../../../components/Page';
import AccountTokensTable from './AccountTokensTable';

const AccountTokensPage = (): ReactElement => {
	const t = useTranslation();

	return (
		<Page>
			<PageHeader title={t('Personal_Access_Tokens')} />
			<PageContent>
				<AccountTokensTable />
			</PageContent>
		</Page>
	);
};

export default AccountTokensPage;
