import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import AccountTokensTable from './AccountTokensTable';
import { Page, PageHeader, PageContent } from '../../../components/Page';

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
