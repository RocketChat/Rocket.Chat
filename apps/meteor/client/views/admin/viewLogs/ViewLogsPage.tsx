import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import AnalyticsReports from './AnalyticsReports';

const ViewLogsPage = (): ReactElement => {
	const { t } = useTranslation();

	return (
		<Page background='tint'>
			<PageHeader title={t('Analytic_reports')} />
			<PageContent>
				<AnalyticsReports />
			</PageContent>
		</Page>
	);
};

export default ViewLogsPage;
