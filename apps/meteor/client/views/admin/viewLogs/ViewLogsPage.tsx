import { Margins, Tabs } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState } from 'react';

import { Page, PageHeader, PageContent } from '../../../components/Page';
import AnalyticsReports from './AnalyticsReports';
import ServerLogs from './ServerLogs';

const ViewLogsPage = (): ReactElement => {
	const t = useTranslation();
	const [tab, setTab] = useState('Logs');

	return (
		<Page background='tint'>
			<PageHeader title={t('Reports')} />
			<Margins blockEnd={24}>
				<Tabs>
					<Tabs.Item onClick={() => setTab('Logs')} selected={tab === 'Logs'}>
						{t('Logs')}
					</Tabs.Item>
					<Tabs.Item onClick={() => setTab('Analytics')} selected={tab === 'Analytics'}>
						{t('Analytic_reports')}
					</Tabs.Item>
				</Tabs>
			</Margins>
			<PageContent>{tab === 'Logs' ? <ServerLogs /> : <AnalyticsReports />}</PageContent>
		</Page>
	);
};

export default ViewLogsPage;
