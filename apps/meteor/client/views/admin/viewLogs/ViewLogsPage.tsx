import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import AnalyticsReports from './AnalyticsReports';

const ViewLogsPage = () => {
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
