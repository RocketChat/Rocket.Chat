import { Margins, Tabs } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import AnalyticsReports from './AnalyticsReports';
import { Page, PageHeader, PageContent } from '../../../components/Page';

const ViewLogsPage = (): ReactElement => {
	const { t } = useTranslation();
	const [tab, setTab] = useState('Analytics');

	return (
		<Page background='tint'>
			<PageHeader title={t('Reports')} />
			<Margins blockEnd={24}>
				<Tabs>
					<Tabs.Item onClick={() => setTab('Analytics')} selected={tab === 'Analytics'}>
						{t('Analytic_reports')}
					</Tabs.Item>
				</Tabs>
			</Margins>
			<PageContent>
				<AnalyticsReports />
			</PageContent>
		</Page>
	);
};

export default ViewLogsPage;
