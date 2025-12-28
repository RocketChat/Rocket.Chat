import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import AccountTokensTable from './AccountTokensTable';

const AccountTokensPage = (): ReactElement => {
	const { t } = useTranslation();

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
