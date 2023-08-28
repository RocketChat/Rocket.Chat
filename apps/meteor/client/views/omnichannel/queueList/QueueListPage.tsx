import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import Page from '../../../components/Page';
import QueueListTable from './QueueListTable';

const QueueListPage = () => {
	const t = useTranslation();

	return (
		<Page>
			<Page.Header title={t('Livechat_Queue')} />
			<Page.Content>
				<QueueListTable />
			</Page.Content>
		</Page>
	);
};

export default QueueListPage;
