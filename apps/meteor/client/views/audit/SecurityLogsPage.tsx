import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import SecurityLogsTable from './components/SecurityLogsTable';
import { Page, PageHeader, PageContent } from '../../components/Page';

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
