import { useTranslation } from 'react-i18next';

import QueueListTable from './QueueListTable';
import { Page, PageHeader, PageContent } from '../../../components/Page';

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
