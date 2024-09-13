import React from 'react';
import { useTranslation } from 'react-i18next';

import { Page, PageHeader, PageContent } from '../../../components/Page';
import QueueListTable from './QueueListTable';

const QueueListPage = () => {
	const { t } = useTranslation();

	return (
		<Page>
			<PageHeader title={t('Livechat_Queue')} />
			<PageContent>
				<QueueListTable />
			</PageContent>
		</Page>
	);
};

export default QueueListPage;
