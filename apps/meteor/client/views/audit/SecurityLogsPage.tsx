import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import SecurityLogsTable from './components/SecurityLogsTable';

const SecurityLogsPage = (): ReactElement => {
	const { t } = useTranslation();

	return (
		<Page>
			<PageHeader title={t('Security_logs')} />
			<PageContent>
				<SecurityLogsTable />
			</PageContent>
		</Page>
	);
};

export default SecurityLogsPage;
